from celery.utils.log import get_task_logger
from src.worker.celery_app import celery_app
from database.mongo_utils import get_db_connection, insert_notification
from database.sql_utils import get_connection
from datetime import datetime, timedelta, timezone
import uuid
from pymongo.errors import PyMongoError
import mysql.connector

def normalize_to_utc(dt: datetime) -> datetime:
    """Ensures a datetime object is timezone-aware and set to UTC."""
    if not dt:
        return dt
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

logger = get_task_logger(__name__)

@celery_app.task(
    name="src.worker.scheduled_tasks.send_reassessment_notification_task",
    queue="low_priority",
    autoretry_for=(PyMongoError, mysql.connector.Error, Exception),
    retry_backoff=True,
    max_retries=3
)
def send_reassessment_notification_task(athlete_id: int, full_name: str, current_month: str):
    insert_notification(
        recipient_id=athlete_id,
        notif_type="REASSESSMENT_REMINDER",
        idempotency_key=f"reassess_{athlete_id}_{current_month}",
        title="Time for a Reassessment!",
        message=f"Hi {full_name}, it's been over 30 days since your last assessment. Upload a new video to track your progress!",
        action_link="/dashboard"
    )
    return f"Reminded {athlete_id}"

@celery_app.task(
    name="src.worker.scheduled_tasks.reassessment_reminder_task",
    queue="low_priority",
    autoretry_for=(PyMongoError, mysql.connector.Error, Exception),
    retry_backoff=True,
    max_retries=3
)
def reassessment_reminder_task():
    """
    Checks for athletes who haven't uploaded an assessment in over 30 days.
    Uses MongoDB aggregation and fans out individual notifications.
    """
    logger.info("Starting 30-day reassessment reminder sweep...")
    try:
        db = get_db_connection()
        cutoff_date = normalize_to_utc(datetime.now(timezone.utc) - timedelta(days=30))
        
        conn = get_connection()
        if not conn:
            return "Failed to connect to MySQL"
            
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT u.id, u.full_name
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE r.role_name = 'athlete' AND u.is_active = 1
        """)
        athletes = cursor.fetchall()
        cursor.close()
        conn.close()
        
        if not athletes:
            return "No athletes found."

        athlete_ids = [str(ath["id"]) for ath in athletes]
        
        # Single query to get latest session date for all athletes
        pipeline = [
            {"$match": {"athlete_id": {"$in": athlete_ids}}},
            {"$sort": {"created_at": -1}},
            {"$group": {"_id": "$athlete_id", "latest_created_at": {"$first": "$created_at"}}}
        ]
        
        latest_sessions = list(db["sessions"].aggregate(pipeline))
        latest_session_map = {doc["_id"]: doc["latest_created_at"] for doc in latest_sessions}
        
        enqueued_count = 0
        current_month = datetime.now(timezone.utc).strftime('%Y%m')
        
        for ath in athletes:
            ath_id_str = str(ath["id"])
            needs_reminder = False
            created_at = latest_session_map.get(ath_id_str)
            
            if created_at:
                if normalize_to_utc(created_at) < cutoff_date:
                    needs_reminder = True
            else:
                needs_reminder = True
                
            if needs_reminder:
                send_reassessment_notification_task.apply_async(args=[ath["id"], ath["full_name"], current_month], queue="low_priority")
                enqueued_count += 1
                
        logger.info(f"Enqueued {enqueued_count} reassessment reminders.")
        return f"Enqueued {enqueued_count} reassessment reminders."
        
    except Exception as e:
        logger.error(f"Error in reassessment reminder task: {e}")
        raise

@celery_app.task(
    name="src.worker.scheduled_tasks.send_weekly_progress_notification_task",
    queue="low_priority",
    autoretry_for=(PyMongoError, mysql.connector.Error, Exception),
    retry_backoff=True,
    max_retries=3
)
def send_weekly_progress_notification_task(athlete_id: int, session_count: int, current_week: str):
    insert_notification(
        recipient_id=athlete_id,
        notif_type="WEEKLY_PROGRESS_REPORT",
        idempotency_key=f"weekly_{athlete_id}_{current_week}",
        title="Your Weekly Progress Report is Ready!",
        message=f"Great job! You completed {session_count} assessment(s) this week. Click here to review your progress.",
        action_link="/dashboard"
    )
    return f"Sent weekly report to {athlete_id}"

@celery_app.task(
    name="src.worker.scheduled_tasks.weekly_progress_report_task",
    queue="low_priority",
    autoretry_for=(PyMongoError, mysql.connector.Error, Exception),
    retry_backoff=True,
    max_retries=3
)
def weekly_progress_report_task():
    """
    Generates a weekly summary notification for athletes who trained this week.
    Uses MongoDB aggregation and fans out individual notifications.
    """
    logger.info("Starting weekly progress report sweep...")
    try:
        db = get_db_connection()
        cutoff_date = normalize_to_utc(datetime.now(timezone.utc) - timedelta(days=7))
        
        conn = get_connection()
        if not conn:
            return "Failed to connect to MySQL"
            
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT u.id, u.full_name
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE r.role_name = 'athlete' AND u.is_active = 1
        """)
        athletes = cursor.fetchall()
        cursor.close()
        conn.close()
        
        if not athletes:
            return "No athletes found."
            
        athlete_ids = [str(ath["id"]) for ath in athletes]
        
        # Single query to get session counts for all athletes this week
        pipeline = [
            {"$match": {"athlete_id": {"$in": athlete_ids}, "created_at": {"$gte": cutoff_date}}},
            {"$group": {"_id": "$athlete_id", "session_count": {"$sum": 1}}}
        ]
        
        weekly_sessions = list(db["sessions"].aggregate(pipeline))
        session_count_map = {doc["_id"]: doc["session_count"] for doc in weekly_sessions}
        
        enqueued_count = 0
        current_week = datetime.now(timezone.utc).strftime('%Y%V')
        
        for ath in athletes:
            session_count = session_count_map.get(str(ath["id"]), 0)
            if session_count > 0:
                send_weekly_progress_notification_task.apply_async(args=[ath["id"], session_count, current_week], queue="low_priority")
                enqueued_count += 1
                
        logger.info(f"Enqueued weekly reports for {enqueued_count} athletes.")
        return f"Enqueued weekly reports for {enqueued_count} athletes."
        
    except Exception as e:
        logger.error(f"Error in weekly progress report task: {e}")
        raise

@celery_app.task(
    name="src.worker.scheduled_tasks.cleanup_cloudinary_videos_task",
    queue="low_priority",
    autoretry_for=(PyMongoError, mysql.connector.Error, Exception),
    retry_backoff=True,
    max_retries=3
)
def cleanup_cloudinary_videos_task():
    """
    Deletes all videos in the Cloudinary raw videos folder to save storage space.
    Intended to be run automatically every midnight.
    """
    logger.info("Starting nightly Cloudinary video cleanup...")
    try:
        from database.cloud_storage import delete_all_raw_videos, delete_all_key_moments
        deleted_videos_count = delete_all_raw_videos()
        deleted_images_count = delete_all_key_moments()
        logger.info(f"Nightly cleanup complete: {deleted_videos_count} videos, {deleted_images_count} key moments deleted.")
        return f"Deleted {deleted_videos_count} videos, {deleted_images_count} key moments"
    except Exception as e:
        logger.error(f"Error in Cloudinary cleanup task: {e}")
        raise
