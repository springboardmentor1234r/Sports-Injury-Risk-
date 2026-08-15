import os
from src.worker.celery_app import celery_app
from database.mongo_utils import get_db_connection
from database.elastic_utils import get_es_client
import time
from src.logger import get_logger
from elasticsearch import ConnectionError as ESConnectionError, ConnectionTimeout

logger = get_logger("search_tasks")

@celery_app.task(
    queue="default",
    autoretry_for=(ESConnectionError, ConnectionTimeout),
    retry_backoff=True,
    max_retries=3
)
def sync_athlete_to_es(athlete_id: int, coach_id: int):
    """
    Sync an athlete's data from PostgreSQL and MongoDB to Elasticsearch.
    This enables fast fuzzy searching on the Coach Dashboard.
    """
    logger.info(f"Starting Elasticsearch sync for athlete {athlete_id}...")
    
    es = get_es_client()
    if not es:
        logger.error("Failed to connect to Elasticsearch. Skipping sync.")
        return False
        
    try:
        # Import inside task to avoid circular dependencies if any
        from database.sql_utils import get_user_by_id
        
        # 1. Fetch from PostgreSQL
        user_data = get_user_by_id(athlete_id)
        if not user_data:
            logger.info(f"Athlete {athlete_id} not found in Postgres.")
            return False
            
        full_name = user_data.get("full_name", "")
        email = user_data.get("email", "")
        
        # 2. Fetch from MongoDB (Athlete Profiles)
        db = get_db_connection()
        profile = db["athlete_profiles"].find_one({"athlete_id": str(athlete_id)})
        
        sport = "General"
        has_previous_injury = "No"
        previous_injury_type = "None"
        profile_picture_url = user_data.get("profile_picture_url")
        
        if profile:
            sport = profile.get("sport", "General")
            has_previous_injury = profile.get("has_previous_injury", "No")
            previous_injury_type = profile.get("previous_injury_type", "None")
            if not profile_picture_url:
                profile_picture_url = profile.get("profile_picture_url")
                
        # 3. Fetch latest Risk Category
        latest_session = db["sessions"].find_one(
            {"athlete_id": str(athlete_id)},
            sort=[("created_at", -1)]
        )
        
        risk_category = "Unknown"
        if latest_session:
            risk_score = db["risk_scores"].find_one({"session_id": latest_session["session_id"]})
            if risk_score:
                risk_data = risk_score.get("risk_data", {})
                risk_category = risk_data.get("risk_category", "Unknown")
                
        # 4. Construct Document for Elasticsearch
        document = {
            "athlete_id": str(athlete_id),
            "coach_id": coach_id,
            "full_name": full_name,
            "email": email,
            "sport": sport,
            "has_previous_injury": has_previous_injury,
            "previous_injury_type": previous_injury_type,
            "risk_category": risk_category,
            "profile_picture_url": profile_picture_url or ""
        }
        
        # 5. Index into Elasticsearch
        res = es.index(index="athletes", id=str(athlete_id), body=document)
        logger.info(f"Successfully synced athlete {athlete_id} to Elasticsearch. Result: {res['result']}")
        return True
        
    except Exception as e:
        logger.error(f"Error syncing athlete {athlete_id} to Elasticsearch: {e}")
        return False

@celery_app.task(
    queue="default",
    autoretry_for=(ESConnectionError, ConnectionTimeout),
    retry_backoff=True,
    max_retries=3
)
def sync_coach_to_es(coach_id: int):
    """Sync a coach to the coaches ES index."""
    logger.info(f"Starting Elasticsearch sync for coach {coach_id}...")
    es = get_es_client()
    if not es:
        return False
        
    try:
        from database.sql_utils import get_user_by_id
        user_data = get_user_by_id(coach_id)
        if not user_data or "coach" not in user_data.get("roles", []):
            return False
            
        document = {
            "id": coach_id,
            "full_name": user_data.get("full_name", ""),
            "email": user_data.get("email", ""),
            "coach_code": user_data.get("coach_code", "")
        }
        
        res = es.index(index="coaches", id=str(coach_id), body=document)
        logger.info(f"Successfully synced coach {coach_id} to Elasticsearch. Result: {res['result']}")
        return True
    except Exception as e:
        logger.error(f"Error syncing coach {coach_id} to Elasticsearch: {e}")
        return False

@celery_app.task(
    queue="default",
    autoretry_for=(ESConnectionError, ConnectionTimeout),
    retry_backoff=True,
    max_retries=3
)
def sync_user_global_to_es(user_id: int):
    """Sync any user to the users_global ES index for admin search."""
    logger.info(f"Starting Elasticsearch sync for user {user_id}...")
    es = get_es_client()
    if not es:
        return False
        
    try:
        from database.sql_utils import get_user_by_id
        user_data = get_user_by_id(user_id)
        if not user_data:
            return False
            
        document = {
            "id": user_id,
            "full_name": user_data.get("full_name", ""),
            "email": user_data.get("email", ""),
            "roles": user_data.get("roles", []),
            "is_active": user_data.get("is_active", True),
            "created_at": str(user_data.get("created_at", ""))
        }
        
        res = es.index(index="users_global", id=str(user_id), body=document)
        logger.info(f"Successfully synced user {user_id} to Elasticsearch. Result: {res['result']}")
        return True
    except Exception as e:
        logger.error(f"Error syncing user {user_id} to Elasticsearch: {e}")
        return False
