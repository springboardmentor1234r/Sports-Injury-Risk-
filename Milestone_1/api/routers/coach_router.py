import os
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from api.dependencies import get_current_user
from database.mongo_utils import get_db_connection
from database.sql_utils import (
    search_coaches_by_name,
    get_assigned_athletes,
    create_athlete_by_coach,
    remove_athlete_from_coach,
    request_coach,
    get_athlete_coach,
    get_coach_requests,
    respond_coach_request,
    get_notifications,
    create_notification,
    create_team,
    add_athlete_to_team,
    get_teams_with_athletes,
    delete_team_by_id,
    update_user_profile_picture
)
from database.sql_utils import get_user_by_email # Fallback lookup if needed
from passlib.hash import bcrypt

router = APIRouter(prefix="/api/coach", tags=["coach"])

import secrets
import string
from src.worker.notification_tasks import send_athlete_welcome_email_task
from src.worker.search_tasks import sync_athlete_to_es
from database.redis_utils import store_otp

class AthleteOnboardSchema(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    profile_picture_url: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = "Other"
    height: Optional[float] = None
    weight: Optional[float] = None
    sport: Optional[str] = "General"
    training_intensity: Optional[str] = "Medium"
    weekly_training_sessions: Optional[int] = None
    has_previous_injury: Optional[str] = "No"
    previous_injury_type: Optional[str] = "None"
    injury_recency: Optional[str] = "None"

class RespondRequestSchema(BaseModel):
    request_id: int
    status: str # 'accepted' or 'rejected'

class TeamCreateSchema(BaseModel):
    name: str

class TeamAddAthleteSchema(BaseModel):
    athlete_id: int

class RequestCoachSchema(BaseModel):
    coach_id: int

@router.get("/coaches/search")
def search_coaches(q: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Search for coaches by name (called by athlete)."""
    return search_coaches_by_name(q)

@router.post("/request")
def request_coach_assignment(payload: RequestCoachSchema, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Athlete requests a coach connection."""
    athlete_id = current_user["user_id"]
    success = request_coach(athlete_id, payload.coach_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Connection request already exists or failed to send."
        )

    # Send Notification to Coach
    try:
        from database.mongo_utils import insert_notification
        import uuid
        athlete_name = current_user.get("full_name", "An athlete")
        insert_notification(
            recipient_id=payload.coach_id,
            notif_type="COACH_REQUEST_RECEIVED",
            idempotency_key=f"coach_req_{athlete_id}_{payload.coach_id}_{uuid.uuid4().hex[:8]}",
            title="New Connection Request",
            message=f"{athlete_name} has requested to connect with you.",
            action_link="/coach-dashboard/network"
        )
    except Exception as e:
        pass # Non-blocking

    return {"message": "Request sent successfully"}

@router.get("/stats")
def get_coach_stats(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Compile dashboard KPI cards, risk distribution, trends and activity feed."""
    if "coach" not in current_user["roles"] and "admin" not in current_user["roles"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    coach_id = current_user["user_id"]
    assigned = get_assigned_athletes(coach_id)
    requests_list = get_coach_requests(coach_id)
    
    total_athletes = len(assigned)
    pending_requests = len(requests_list)
    
    high_risk = 0
    medium_risk = 0
    low_risk = 0
    today_uploads = 0
    
    db = get_db_connection()
    activity_feed = []
    
    # Calculate time boundaries
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    
    athlete_ids = [str(ath["id"]) for ath in assigned]
    
    # Gather statistics and latest sessions
    for ath in assigned:
        ath_id_str = str(ath["id"])
        # Get latest session
        latest_session = db["sessions"].find_one(
            {"athlete_id": ath_id_str},
            sort=[("created_at", -1)]
        )
        
        if latest_session:
            session_id = latest_session["session_id"]
            risk_score = db["risk_scores"].find_one({"session_id": session_id})
            
            if risk_score:
                risk_data = risk_score.get("risk_data", {})
                category = risk_data.get("risk_category", "Unknown Risk").lower()
                if "high" in category or "critical" in category:
                    high_risk += 1
                elif "moderate" in category or "medium" in category:
                    medium_risk += 1
                else:
                    low_risk += 1
            else:
                low_risk += 1
        else:
            low_risk += 1
            
        # Count today's uploads for this athlete
        uploads_today_count = db["sessions"].count_documents({
            "athlete_id": ath_id_str,
            "created_at": {"$gte": today_start}
        })
        today_uploads += uploads_today_count

    # Fetch recent uploads activity feed across assigned roster
    if athlete_ids:
        recent_sessions = list(db["sessions"].find(
            {"athlete_id": {"$in": athlete_ids}},
            sort=[("created_at", -1)],
            limit=10
        ))
        
        for s in recent_sessions:
            risk_score = db["risk_scores"].find_one({"session_id": s["session_id"]})
            risk_cat = "Unknown"
            if risk_score:
                risk_cat = risk_score.get("risk_data", {}).get("risk_category", "Unknown")
            
            # Find athlete name
            ath_obj = next((a for a in assigned if str(a["id"]) == s["athlete_id"]), None)
            ath_name = ath_obj["full_name"] if ath_obj else "Unknown Athlete"
            
            activity_feed.append({
                "athlete_name": ath_name,
                "video_name": s.get("video_name", "Video Session"),
                "risk_category": risk_cat,
                "created_at": s.get("created_at")
            })

    # Return summary statistics
    return {
        "total_athletes": total_athletes,
        "high_risk": high_risk,
        "medium_risk": medium_risk,
        "low_risk": low_risk,
        "pending_requests": pending_requests,
        "today_uploads": today_uploads,
        "activity_feed": activity_feed
    }

@router.get("/athletes")
def get_roster_athletes(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Fetch all athletes assigned to this coach with summary scores and profile fields."""
    if "coach" not in current_user["roles"] and "admin" not in current_user["roles"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    coach_id = current_user["user_id"]
    
    from database.redis_utils import get_redis_client
    import json
    
    redis_client = get_redis_client()
    cache_key = f"coach:{coach_id}:roster"
    
    # Try cache
    try:
        cached = redis_client.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass
        
    assigned = get_assigned_athletes(coach_id)
    
    db = get_db_connection()
    roster = []
    
    for ath in assigned:
        ath_id_str = str(ath["id"])
        
        # Load demographic profile from MongoDB
        profile = db["athlete_profiles"].find_one({"athlete_id": ath_id_str})
        if profile:
            profile["_id"] = str(profile["_id"])
        else:
            profile = {}
            
        # Get latest session details
        latest_session = db["sessions"].find_one(
            {"athlete_id": ath_id_str},
            sort=[("created_at", -1)]
        )
        
        latest_score = 0
        risk_category = "No Sessions"
        latest_session_date = None
        
        if latest_session:
            latest_session_date = latest_session.get("created_at")
            risk_score = db["risk_scores"].find_one({"session_id": latest_session["session_id"]})
            if risk_score:
                risk_data = risk_score.get("risk_data", {})
                latest_score = risk_data.get("overall_health_score", 0)
                risk_category = risk_data.get("risk_category", "Unknown")
        
        roster.append({
            "id": ath["id"],
            "full_name": ath["full_name"],
            "email": ath["email"],
            "profile_picture_url": ath.get("profile_picture_url") or (profile.get("profile_picture_url") if profile else None),
            "latest_score": latest_score,
            "risk_category": risk_category,
            "latest_session_date": latest_session_date,
            "profile": profile
        })
        
    # Set cache (300 seconds)
    try:
        redis_client.setex(cache_key, 300, json.dumps(roster))
    except Exception:
        pass
        
    return roster

@router.get("/athletes/search")
def search_coach_athletes(q: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Search assigned athletes using Elasticsearch fuzzy matching."""
    if "coach" not in current_user["roles"] and "admin" not in current_user["roles"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    coach_id = current_user["user_id"]
    
    from database.elastic_utils import get_es_client
    es = get_es_client()
    
    if not es:
        # Fallback to empty if ES is down
        return []
        
    try:
        query_body = {
            "query": {
                "bool": {
                    "must": [
                        {"match": {"coach_id": coach_id}}
                    ],
                    "should": [
                        {
                            "multi_match": {
                                "query": q,
                                "fields": ["full_name^3", "email", "sport", "has_previous_injury", "previous_injury_type", "risk_category"],
                                "fuzziness": "AUTO"
                            }
                        }
                    ],
                    "minimum_should_match": 1
                }
            }
        }
        
        res = es.search(index="athletes", body=query_body, size=20)
        
        results = []
        for hit in res["hits"]["hits"]:
            source = hit["_source"]
            results.append({
                "id": int(source.get("athlete_id", 0)),
                "full_name": source.get("full_name"),
                "email": source.get("email"),
                "sport": source.get("sport"),
                "risk_category": source.get("risk_category"),
                "profile_picture_url": source.get("profile_picture_url")
            })
            
        return results
    except Exception as e:
        print(f"Elasticsearch search failed: {e}")
        return []

@router.post("/respond-request")
def respond_request(payload: RespondRequestSchema, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Approve or Reject pending connection requests."""
    if "coach" not in current_user["roles"] and "admin" not in current_user["roles"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    coach_id = current_user["user_id"]
    coach_name = current_user.get("full_name", "A coach")
    
    # Pre-fetch request details to get the athlete_id for notification
    requests_list = get_coach_requests(coach_id)
    req_details = next((r for r in requests_list if r["id"] == payload.request_id), None)
    
    success = respond_coach_request(payload.request_id, payload.status)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to respond to request")
        
    try:
        from database.redis_utils import get_redis_client
        get_redis_client().delete(f"coach:{coach_id}:roster")
    except Exception:
        pass
        
    # Send Notification to Athlete
    if req_details:
        try:
            from database.mongo_utils import insert_notification
            import uuid
            action = "accepted" if payload.status.lower() == "accepted" else "rejected"
            insert_notification(
                recipient_id=req_details["athlete_id"],
                notif_type=f"COACH_REQUEST_{action.upper()}",
                idempotency_key=f"coach_resp_{req_details['id']}_{uuid.uuid4().hex[:8]}",
                title=f"Connection {action.title()}",
                message=f"{coach_name} has {action} your connection request.",
                action_link="/dashboard"
            )
        except Exception as e:
            pass # Non-blocking

    return {"message": f"Request status updated to {payload.status}."}

@router.get("/notifications")
def get_coach_alerts(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Fetch notifications and pending requests for the logged-in coach."""
    if "coach" not in current_user["roles"] and "admin" not in current_user["roles"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    coach_id = current_user["user_id"]
    requests_list = get_coach_requests(coach_id)
    general_notifications = get_notifications(coach_id)
    
    return {
        "requests": requests_list,
        "notifications": general_notifications
    }

@router.post("/register-athlete")
def register_athlete(payload: AthleteOnboardSchema, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Manually register and assign an athlete to the logged-in coach's roster."""
    if "coach" not in current_user["roles"] and "admin" not in current_user["roles"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    coach_id = current_user["user_id"]
    athlete_id = None
    email_sent = False
    
    # 1. Handle MySQL login creation if email provided
    if payload.email and payload.email.strip():
        # Check if user already exists
        existing = get_user_by_email(payload.email)
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
            
        # Generate a dummy password hash just to create the account securely
        dummy_pwd = secrets.token_urlsafe(32)
        password_hash = bcrypt.hash(dummy_pwd)
        
        athlete_id = create_athlete_by_coach(payload.email, password_hash, payload.full_name, coach_id)
        if not athlete_id:
            raise HTTPException(status_code=500, detail="Failed to create athlete account")
            
        # Generate a secure, single-use password-reset token
        reset_token = secrets.token_urlsafe(32)
        store_otp(payload.email, reset_token, prefix="reset_otp", expiry_seconds=86400) # Valid for 24 hours
        
        # Send credentials via email asynchronously (passing the token, NOT a password)
        send_athlete_welcome_email_task.apply_async(args=[payload.email, payload.full_name, reset_token], queue='default')
        email_sent = True
    else:
        # 2. Local-only anonymous profile
        virtual_uuid = secrets.token_hex(6)
        virtual_email = f"anonymous_{virtual_uuid}@moveiq.local"
        dummy_pwd = secrets.token_urlsafe(16)
        password_hash = bcrypt.hash(dummy_pwd)
        
        athlete_id = create_athlete_by_coach(virtual_email, password_hash, payload.full_name, coach_id)
        if not athlete_id:
            raise HTTPException(status_code=500, detail="Failed to create local athlete profile")
            
    # Save profile picture in MySQL if present
    if payload.profile_picture_url:
        update_user_profile_picture(athlete_id, payload.profile_picture_url)

    # 3. Synchronize initial demographic profile in MongoDB
    db = get_db_connection()
    db["athlete_profiles"].update_one(
        {"athlete_id": str(athlete_id)},
        {"$set": {
            "athlete_id": str(athlete_id),
            "profile_picture_url": payload.profile_picture_url,
            "age": payload.age,
            "gender": payload.gender or "Other",
            "has_previous_injury": payload.has_previous_injury or "No",
            "height": payload.height,
            "weight": payload.weight,
            "sport": payload.sport or "General",
            "training_intensity": payload.training_intensity or "Medium",
            "weekly_training_sessions": payload.weekly_training_sessions,
            "injury_recency": payload.injury_recency or "None",
            "previous_injury_type": payload.previous_injury_type or "None",
            "is_default": False
        }},
        upsert=True
    )
    
    # 4. Sync to Elasticsearch for search
    try:
        sync_athlete_to_es.apply_async(args=[athlete_id, coach_id], queue='default')
    except Exception as e:
        print(f"Failed to trigger ES sync for new athlete {athlete_id}: {e}")
    
    msg = "Athlete registered successfully."
    if payload.email and payload.email.strip():
        msg += " Login credentials emailed to athlete." if email_sent else " Failed to send credential notification email."
        
    return {
        "message": msg,
        "athlete_id": athlete_id,
        "email_sent": email_sent
    }

@router.get("/athletes/{athlete_id}/history")
def get_athlete_session_history(athlete_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieve full analysis history and demographic details for a single roster athlete."""
    if "coach" not in current_user["roles"] and "admin" not in current_user["roles"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    coach_id = current_user["user_id"]
    assigned = get_assigned_athletes(coach_id)
    is_assigned = any(ath["id"] == athlete_id for ath in assigned)
    if not is_assigned and "admin" not in current_user["roles"]:
        raise HTTPException(status_code=403, detail="Not authorized to access this athlete's data")
        
    db = get_db_connection()
    
    # Load session history
    sessions = list(db["sessions"].find(
        {"athlete_id": str(athlete_id)},
        {"key_moments": 0}
    ).sort("created_at", -1))
    
    for s in sessions:
        s["_id"] = str(s["_id"])
        risk_score = db["risk_scores"].find_one({"session_id": s["session_id"]})
        if risk_score:
            s["risk_data"] = risk_score.get("risk_data", {})
        else:
            s["risk_data"] = {}
            
        bio_data = db["biomechanics_data"].find_one({"session_id": s["session_id"]})
        if bio_data:
            s["biomechanics"] = bio_data.get("summary", {})
        else:
            s["biomechanics"] = {}
            
    # Load profile details
    profile = db["athlete_profiles"].find_one({"athlete_id": str(athlete_id)})
    if profile:
        profile["_id"] = str(profile["_id"])
    else:
        profile = {}
        
    from database.sql_utils import get_user_by_id
    user_info = get_user_by_id(int(athlete_id))
    if user_info:
        profile["full_name"] = user_info.get("full_name")
        profile["email"] = user_info.get("email")
        if not profile.get("profile_picture_url") and user_info.get("profile_picture_url"):
            profile["profile_picture_url"] = user_info.get("profile_picture_url")
        
    return {
        "profile": profile,
        "history": sessions
    }

@router.post("/athletes/{athlete_id}/profile")
def update_athlete_profile_by_coach(athlete_id: int, payload: Dict[str, Any], current_user: Dict[str, Any] = Depends(get_current_user)):
    """Update demographic details in MongoDB for a single athlete assigned to this coach."""
    if "coach" not in current_user["roles"] and "admin" not in current_user["roles"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    coach_id = current_user["user_id"]
    assigned = get_assigned_athletes(coach_id)
    is_assigned = any(ath["id"] == athlete_id for ath in assigned)
    if not is_assigned and "admin" not in current_user["roles"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this athlete's profile")
        
    if payload.get("profile_picture_url"):
        update_user_profile_picture(athlete_id, payload.get("profile_picture_url"))

    db = get_db_connection()
    db["athlete_profiles"].update_one(
        {"athlete_id": str(athlete_id)},
        {"$set": {
            "athlete_id": str(athlete_id),
            "profile_picture_url": payload.get("profile_picture_url"),
            "age": payload.get("age"),
            "gender": payload.get("gender", "Other"),
            "has_previous_injury": payload.get("has_previous_injury", "No"),
            "height": payload.get("height"),
            "weight": payload.get("weight"),
            "sport": payload.get("sport", "General"),
            "training_intensity": payload.get("training_intensity", "Medium"),
            "weekly_training_sessions": payload.get("weekly_training_sessions"),
            "injury_recency": payload.get("injury_recency", "None"),
            "previous_injury_type": payload.get("previous_injury_type", "None"),
            "is_default": False
        }},
        upsert=True
    )
    
    # Sync changes to Elasticsearch
    try:
        sync_athlete_to_es.apply_async(args=[athlete_id, coach_id], queue='default')
    except Exception as e:
        print(f"Failed to trigger ES sync for updated athlete {athlete_id}: {e}")
        
    return {"message": "Profile updated successfully"}

@router.post("/teams")
def create_new_team(payload: TeamCreateSchema, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Create a new custom team group."""
    if "coach" not in current_user["roles"] and "admin" not in current_user["roles"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    coach_id = current_user["user_id"]
    team_id = create_team(coach_id, payload.name)
    if not team_id:
        raise HTTPException(status_code=500, detail="Failed to create team")
    return {"message": "Team created successfully", "team_id": team_id}

@router.post("/teams/{team_id}/athletes")
def add_athlete_to_team_group(team_id: int, payload: TeamAddAthleteSchema, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Add a roster athlete into a team group."""
    if "coach" not in current_user["roles"] and "admin" not in current_user["roles"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    # Verify athlete is assigned to coach
    coach_id = current_user["user_id"]
    assigned = get_assigned_athletes(coach_id)
    is_assigned = any(ath["id"] == payload.athlete_id for ath in assigned)
    if not is_assigned and "admin" not in current_user["roles"]:
        raise HTTPException(status_code=403, detail="Athlete must be on your roster first.")
        
    success = add_athlete_to_team(team_id, payload.athlete_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to add athlete to team")
    return {"message": "Athlete added to team successfully"}

@router.get("/teams")
def get_teams(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get all teams with assigned athletes."""
    if "coach" not in current_user["roles"] and "admin" not in current_user["roles"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    coach_id = current_user["user_id"]
    return get_teams_with_athletes(coach_id)

@router.delete("/teams/{team_id}")
def delete_coach_team(team_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Delete a custom team group."""
    if "coach" not in current_user["roles"] and "admin" not in current_user["roles"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    coach_id = current_user["user_id"]
    success = delete_team_by_id(coach_id, team_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete team group")
    return {"message": "Team deleted successfully"}

@router.get("/athlete-status")
def get_status_for_athlete(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Allows an athlete to see if they have an assigned coach or pending request."""
    athlete_id = current_user["user_id"]
    status_info = get_athlete_coach(athlete_id)
    return status_info if status_info else {"status": "none"}

@router.delete("/athletes/{athlete_id}")
def delete_athlete_assignment(athlete_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Removes an athlete connection from the coach's roster."""
    if "coach" not in current_user["roles"] and "admin" not in current_user["roles"]:
        raise HTTPException(status_code=403, detail="Only coaches or admins can remove assignments")
        
    coach_id = current_user["user_id"]
    success = remove_athlete_from_coach(coach_id, athlete_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to remove athlete connection")
        
    try:
        from database.redis_utils import get_redis_client
        get_redis_client().delete(f"coach:{coach_id}:roster")
    except Exception:
        pass
        
    return {"message": "Athlete connection removed successfully"}
