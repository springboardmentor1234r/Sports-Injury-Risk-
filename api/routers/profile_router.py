from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any
from api.dependencies import get_current_user
from database.mongo_utils import get_athlete_profile, get_db_connection

router = APIRouter(prefix="/api/profile", tags=["profile"])

class AthleteProfileUpdate(BaseModel):
    has_previous_injury: str
    injury_recency: str
    previous_injury_type: str
    training_intensity: str
    weekly_training_sessions: int

def save_athlete_profile(athlete_id: str, profile_data: dict):
    """Helper to save/update athlete profile in MongoDB"""
    db = get_db_connection()
    collection = db["athlete_profiles"]
    
    # Update or insert the profile (upsert)
    profile_data["athlete_id"] = athlete_id
    collection.update_one(
        {"athlete_id": athlete_id},
        {"$set": profile_data},
        upsert=True
    )

@router.get("/")
def get_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    athlete_id = current_user["user_id"]
    profile = get_athlete_profile(athlete_id)
    # Remove MongoDB's internal _id field for JSON serialization
    if "_id" in profile:
        profile["_id"] = str(profile["_id"])
    return profile

@router.post("/")
@router.put("/")
def update_profile(
    profile: AthleteProfileUpdate, 
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    athlete_id = current_user["user_id"]
    save_athlete_profile(athlete_id, profile.model_dump())
    return {"message": "Profile updated successfully"}
