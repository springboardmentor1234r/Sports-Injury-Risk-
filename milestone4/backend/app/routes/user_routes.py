from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from datetime import datetime
from app.database import get_db
from app.auth import get_current_user
from app.schemas import (
    UserResponse, ProfileUpdate, UserRole,
    AthleteProfileCreate, AthleteProfileUpdate, AthleteProfileResponse
)

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        fullname=current_user["fullname"],
        role=UserRole(current_user["role"]),
        created_at=current_user["created_at"]
    )

@router.put("/me/update", response_model=UserResponse)
async def update_profile(profile_data: ProfileUpdate, current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    update_fields = {}
    
    if profile_data.fullname is not None:
        update_fields["fullname"] = profile_data.fullname
    # Standard profile fields
    if profile_data.bio is not None:
        update_fields["bio"] = profile_data.bio
    if profile_data.phone is not None:
        update_fields["phone"] = profile_data.phone
    if profile_data.age is not None:
        update_fields["age"] = profile_data.age
    if profile_data.gender is not None:
        update_fields["gender"] = profile_data.gender
        
    if not update_fields:
        # No updates provided, just return current user
        return await get_me(current_user)
        
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": update_fields}
    )
    
    # Retrieve updated user
    updated_user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    
    return UserResponse(
        id=str(updated_user["_id"]),
        email=updated_user["email"],
        fullname=updated_user["fullname"],
        role=UserRole(updated_user["role"]),
        created_at=updated_user["created_at"]
    )

@router.get("/athlete-profile", response_model=AthleteProfileResponse)
async def get_athlete_profile(current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    if current_user.get("role") != "Athlete":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only accounts with the Athlete role can access athlete profile details."
        )
        
    profile = await db.athlete_profiles.find_one({"email": current_user["email"]})
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete profile questionnaire not filled yet."
        )
    return profile

@router.post("/athlete-profile", response_model=AthleteProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_athlete_profile(
    profile_data: AthleteProfileCreate, 
    current_user: dict = Depends(get_current_user), 
    db = Depends(get_db)
):
    if current_user.get("role") != "Athlete":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only accounts with the Athlete role can submit the profile questionnaire."
        )
        
    # Check if profile already exists
    existing = await db.athlete_profiles.find_one({"email": current_user["email"]})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Athlete profile already exists."
        )
        
    # Generate unique Athlete ID (ATH-1000 + count)
    count = await db.athlete_profiles.count_documents({})
    athlete_id = f"ATH-{1001 + count}"
    
    now = datetime.utcnow()
    new_profile = {
        "athlete_id": athlete_id,
        "email": current_user["email"],
        "sport_type": profile_data.sport_type,
        "position": profile_data.position,
        "age": profile_data.age,
        "height": profile_data.height,
        "weight": profile_data.weight,
        "injury_history": profile_data.injury_history,
        "training_load": profile_data.training_load,
        "assigned_coach": profile_data.assigned_coach,
        "assigned_physio": profile_data.assigned_physio,
        "created_at": now,
        "updated_at": now
    }
    
    await db.athlete_profiles.insert_one(new_profile)
    return new_profile

@router.put("/athlete-profile", response_model=AthleteProfileResponse)
async def update_athlete_profile(
    profile_data: AthleteProfileUpdate, 
    current_user: dict = Depends(get_current_user), 
    db = Depends(get_db)
):
    if current_user.get("role") != "Athlete":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only accounts with the Athlete role can update athlete profile details."
        )
        
    existing = await db.athlete_profiles.find_one({"email": current_user["email"]})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete profile does not exist. Complete the questionnaire first."
        )
        
    update_fields = {}
    if profile_data.sport_type is not None:
        update_fields["sport_type"] = profile_data.sport_type
    if profile_data.position is not None:
        update_fields["position"] = profile_data.position
    if profile_data.age is not None:
        update_fields["age"] = profile_data.age
    if profile_data.height is not None:
        update_fields["height"] = profile_data.height
    if profile_data.weight is not None:
        update_fields["weight"] = profile_data.weight
    if profile_data.injury_history is not None:
        update_fields["injury_history"] = profile_data.injury_history
    if profile_data.training_load is not None:
        update_fields["training_load"] = profile_data.training_load
    if profile_data.assigned_coach is not None:
        update_fields["assigned_coach"] = profile_data.assigned_coach
    if profile_data.assigned_physio is not None:
        update_fields["assigned_physio"] = profile_data.assigned_physio
        
    if not update_fields:
        return existing
        
    update_fields["updated_at"] = datetime.utcnow()
    
    await db.athlete_profiles.update_one(
        {"email": current_user["email"]},
        {"$set": update_fields}
    )
    
    updated_profile = await db.athlete_profiles.find_one({"email": current_user["email"]})
    return updated_profile

DEFAULT_COACHES = [
    {"fullname": "Coach Alex Ferguson", "email": "coach.alex@sird.org"},
    {"fullname": "Coach Erik ten Hag", "email": "coach.erik@sird.org"},
    {"fullname": "Coach Carlo Ancelotti", "email": "coach.carlo@sird.org"},
    {"fullname": "Coach Pep Guardiola", "email": "coach.pep@sird.org"},
    {"fullname": "Coach Jurgen Klopp", "email": "coach.jurgen@sird.org"}
]

DEFAULT_PHYSIOS = [
    {"fullname": "Dr. John Carter (PT)", "email": "dr.john@sird.org"},
    {"fullname": "Dr. Sarah Jenkins (PT)", "email": "dr.sarah@sird.org"},
    {"fullname": "Dr. Michael Chen (PT)", "email": "dr.michael@sird.org"},
    {"fullname": "Dr. Emma Watson (PT)", "email": "dr.emma@sird.org"}
]

@router.get("/coaches")
async def get_coaches(db = Depends(get_db)):
    cursor = db.users.find({"role": "Coach"}, {"fullname": 1, "email": 1, "_id": 0})
    coaches = await cursor.to_list(length=100)
    if not coaches:
        return DEFAULT_COACHES
    return coaches

@router.get("/physiotherapists")
async def get_physiotherapists(db = Depends(get_db)):
    cursor = db.users.find({"role": "Physiotherapist"}, {"fullname": 1, "email": 1, "_id": 0})
    physios = await cursor.to_list(length=100)
    if not physios:
        return DEFAULT_PHYSIOS
    return physios


@router.get("/my-athletes")
async def get_my_athletes(current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    role = current_user.get("role")
    fullname = current_user.get("fullname")
    
    if role == "Coach":
        cursor = db.athlete_profiles.find({"assigned_coach": fullname})
    elif role == "Physiotherapist":
        cursor = db.athlete_profiles.find({"assigned_physio": fullname})
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Coaches or Physiotherapists can query assigned athletes."
        )
        
    athletes = await cursor.to_list(length=100)
    enriched_athletes = []
    
    for athlete in athletes:
        athlete["id"] = str(athlete["_id"])
        del athlete["_id"]
        # Fetch athlete's actual user details to get their full name
        user_info = await db.users.find_one({"email": athlete["email"]})
        if user_info:
            athlete["fullname"] = user_info["fullname"]
        else:
            athlete["fullname"] = "Unknown Athlete"
        enriched_athletes.append(athlete)
        
    return enriched_athletes

@router.get("/all-athletes-anonymized")
async def get_all_athletes_anonymized(current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    if current_user.get("role") != "Sports Scientist":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Sports Scientists can retrieve anonymized research logs."
        )
        
    cursor = db.athlete_profiles.find({}, {"email": 0, "_id": 0})
    return await cursor.to_list(length=200)
