"""
Models helper file providing data dictionary builders and converters for database entities.
"""

from datetime import datetime
import uuid
from typing import Dict, Any, Optional

def create_user_model(
    full_name: str,
    email: str,
    hashed_password: str,
    role: str,
    phone_number: str = ""
) -> Dict[str, Any]:
    now = datetime.utcnow().isoformat()
    user_id = str(uuid.uuid4())
    return {
        "_id": user_id,
        "id": user_id,
        "full_name": full_name,
        "email": email.lower(),
        "hashed_password": hashed_password,
        "role": role.lower(),
        "phone_number": phone_number,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }

def create_athlete_model(
    name: str,
    sport_type: str,
    position: str,
    age: int,
    height: float,
    weight: float,
    injury_history: str = "None reported",
    training_load: str = "Moderate",
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    now = datetime.utcnow().isoformat()
    athlete_id = str(uuid.uuid4())
    return {
        "_id": athlete_id,
        "id": athlete_id,
        "user_id": user_id,
        "name": name,
        "sport_type": sport_type,
        "position": position,
        "age": age,
        "height": height,
        "weight": weight,
        "injury_history": injury_history,
        "training_load": training_load,
        "recent_risk_score": 24.5,
        "risk_level": "Low",
        "movement_quality_score": 84.0,
        "overall_health_score": 88.0,
        "sessions_analyzed": 0,
        "profile_image": None,
        "created_at": now,
        "updated_at": now
    }

def create_notification_model(
    user_id: str,
    title: str,
    message: str,
    priority: str = "Info"
) -> Dict[str, Any]:
    now = datetime.utcnow().isoformat()
    notif_id = str(uuid.uuid4())
    return {
        "_id": notif_id,
        "id": notif_id,
        "user_id": user_id,
        "title": title,
        "message": message,
        "priority": priority,
        "is_read": False,
        "created_at": now
    }
