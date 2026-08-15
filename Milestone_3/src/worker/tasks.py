import os
from src.worker.celery_app import celery_app
from src.main import run_pipeline
from src.logger import get_logger

logger = get_logger("celery_worker")

@celery_app.task(bind=True)
def process_video_task(self, file_path: str, athlete_id: str, video_name: str, session_id: str):
    """
    Celery task that runs the heavy AI pipeline in the background.
    """
    try:
        # If the file path is a Cloudinary URL, download it locally first
        if file_path.startswith("http://") or file_path.startswith("https://"):
            import requests
            from src.config import RAW_VIDEOS_DIR
            
            os.makedirs(RAW_VIDEOS_DIR, exist_ok=True)
            local_path = os.path.join(RAW_VIDEOS_DIR, f"downloaded_{session_id}.mp4")
            
            logger.info(f"Downloading video from Cloudinary for session {session_id}...")
            response = requests.get(file_path, stream=True)
            response.raise_for_status()
            with open(local_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            # Point file_path to the local download for the pipeline
            file_path = local_path

        # Run the existing synchronous pipeline
        # The pipeline itself will publish progress to Redis for WebSockets
        result = run_pipeline(athlete_id=athlete_id, video_name=video_name, source_path=file_path, explicit_session_id=session_id)
        
        # Cleanup the temporary video file
        if os.path.exists(file_path):
            os.remove(file_path)
            
        # Send Notifications
        try:
            from database.mongo_utils import insert_notification
            from database.sql_utils import get_athlete_coach, get_user_by_id
            
            # Notify Athlete
            insert_notification(
                recipient_id=int(athlete_id),
                notif_type="ANALYSIS_COMPLETED",
                idempotency_key=f"analysis_complete_{session_id}_athlete_{athlete_id}",
                title="Analysis Complete",
                message=f"Your video '{video_name}' has been successfully analyzed.",
                action_link=f"/dashboard/sessions/{session_id}"
            )
            
            # Notify Coach (if athlete has one)
            coach_data = get_athlete_coach(int(athlete_id))
            if coach_data and "coach_email" in coach_data:
                from database.sql_utils import get_user_by_email
                coach_user = get_user_by_email(coach_data["coach_email"])
                if coach_user:
                    coach_id = coach_user["id"]
                    athlete_info = get_user_by_id(int(athlete_id))
                    athlete_name = athlete_info.get("full_name", "An athlete") if athlete_info else "An athlete"
                    
                    insert_notification(
                        recipient_id=int(coach_id),
                        notif_type="ATHLETE_UPLOADED",
                        idempotency_key=f"analysis_complete_{session_id}_coach_{coach_id}",
                        title="New Athlete Assessment",
                        message=f"{athlete_name} has just completed a new video analysis.",
                        action_link=f"/coach-dashboard/athletes/{athlete_id}/sessions/{session_id}"
                    )
        except Exception as notif_e:
            logger.error(f"Failed to send analysis notifications: {notif_e}")
            
        # Dispatch Webhooks
        try:
            from database.webhook_utils import dispatch_webhook_event
            payload = {
                "event": "video.processing_complete",
                "athlete_id": athlete_id,
                "session_id": session_id,
                "video_name": video_name
            }
            # Trigger for athlete
            dispatch_webhook_event("video.processing_complete", payload, user_id=int(athlete_id))
            
            # Trigger for coach
            if 'coach_id' in locals():
                dispatch_webhook_event("video.processing_complete", payload, user_id=int(coach_id))
                
            # Check for High Risk Event
            try:
                from database.mongo_utils import get_risk_score
                risk_data = get_risk_score(session_id)
                if risk_data and risk_data.get("risk_data", {}).get("risk_category") in ("High Risk", "Critical Risk"):
                    high_risk_payload = {
                        "event": "athlete.high_risk_detected",
                        "athlete_id": athlete_id,
                        "session_id": session_id,
                        "risk_score": risk_data.get("risk_data", {}).get("final_risk_score")
                    }
                    dispatch_webhook_event("athlete.high_risk_detected", high_risk_payload, user_id=int(athlete_id))
                    if 'coach_id' in locals():
                        dispatch_webhook_event("athlete.high_risk_detected", high_risk_payload, user_id=int(coach_id))
            except Exception as e:
                logger.error(f"Failed to check high risk for webhook: {e}")
                
        except Exception as webhook_e:
            logger.error(f"Failed to dispatch webhooks: {webhook_e}")
            
        # Sync updated risk category to Elasticsearch
        try:
            from src.worker.search_tasks import sync_athlete_to_es
            c_id = int(coach_id) if 'coach_id' in locals() else 0
            sync_athlete_to_es.apply_async(args=[int(athlete_id), c_id], queue='default')
        except Exception as es_e:
            logger.error(f"Failed to trigger ES sync: {es_e}")
            
        return {"status": "success", "session_id": session_id}
        
    except Exception as e:
        # Ensure cleanup even on failure
        if os.path.exists(file_path):
            os.remove(file_path)
            
        # We can publish a failure message to the WebSocket channel
        try:
            import redis
            import json
            from database.redis_utils import get_redis_url
            r = redis.from_url(get_redis_url())
            r.publish(f"session_progress_{session_id}", json.dumps({"step": "ERROR", "progress": 100, "error": str(e)}))
        except Exception as pub_e:
            logger.warning(f"Could not publish error progress to Redis: {pub_e}")
            
        raise e
