from celery import Celery
import os
from dotenv import load_dotenv
from database.redis_utils import get_redis_url
from celery.schedules import crontab

load_dotenv()

import urllib.parse
redis_url = get_redis_url()

# Celery (Kombu) explicitly requires CERT_NONE instead of none
parsed = urllib.parse.urlparse(redis_url)
query_params = urllib.parse.parse_qs(parsed.query)
if "ssl_cert_reqs" in query_params and "none" in query_params["ssl_cert_reqs"]:
    query_params["ssl_cert_reqs"] = ["CERT_NONE"]
new_query = urllib.parse.urlencode(query_params, doseq=True)
celery_redis_url = urllib.parse.urlunparse(parsed._replace(query=new_query))

celery_app = Celery(
    "moveiq_worker",
    broker=celery_redis_url,
    backend=celery_redis_url,
    include=["src.worker.tasks", "src.worker.notification_tasks", "src.worker.scheduled_tasks", "src.worker.search_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    broker_connection_retry_on_startup=True,
)

# Auto-discover tasks in specific modules
celery_app.autodiscover_tasks([
    'src.worker.tasks', 
    'src.worker.notification_tasks',
    'src.worker.scheduled_tasks',
    'src.worker.search_tasks'
])

# Configure task routing to specific queues
celery_app.conf.task_routes = {
    'src.worker.notification_tasks.send_otp_*': {'queue': 'high_priority'},
    'src.worker.notification_tasks.send_security_alert_task': {'queue': 'high_priority'},
    'src.worker.notification_tasks.*': {'queue': 'default'},
    'src.worker.tasks.*': {'queue': 'video_processing'},
    'src.worker.scheduled_tasks.*': {'queue': 'low_priority'},
    'src.worker.search_tasks.*': {'queue': 'default'},
}

# Configure Celery Beat schedule (Times are in UTC)
celery_app.conf.beat_schedule = {
    'weekly-progress-report-monday-8am': {
        'task': 'src.worker.scheduled_tasks.weekly_progress_report_task',
        'schedule': crontab(hour=2, minute=30, day_of_week=1), # 8 AM IST = 2:30 AM UTC
    },
    'daily-reassessment-reminder-10am': {
        'task': 'src.worker.scheduled_tasks.reassessment_reminder_task',
        'schedule': crontab(hour=4, minute=30), # 10 AM IST = 4:30 AM UTC
    },
    'nightly-cloudinary-cleanup-midnight': {
        'task': 'src.worker.scheduled_tasks.cleanup_cloudinary_videos_task',
        'schedule': crontab(hour=21, minute=30), # 3 AM IST = 9:30 PM UTC
    },
}
