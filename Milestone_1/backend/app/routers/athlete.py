from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.athlete_profile import AthleteProfile
from app.models.user import User
from app.schemas.athlete_profile_schema import (
    AthleteProfileCreate,
    AthleteProfileUpdate,
    AthleteProfileResponse
)
from app.utils.dependencies import get_current_user

router = APIRouter(
    prefix="/athlete",
    tags=["Athlete"]
)
@router.post(
    "/profile",
    response_model=AthleteProfileResponse
)

def create_profile(
    profile: AthleteProfileCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    user = db.query(User).filter(
        User.email == current_user["sub"]
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    existing_profile = db.query(AthleteProfile).filter(
        AthleteProfile.user_id == user.id
    ).first()

    if existing_profile:
        raise HTTPException(
            status_code=400,
            detail="Profile already exists"
        )

    athlete = AthleteProfile(
        user_id=user.id,
        age=profile.age,
        gender=profile.gender,
        height=profile.height,
        weight=profile.weight,
        sport=profile.sport,
        experience=profile.experience,
        position=profile.position
    )

    db.add(athlete)
    db.commit()
    db.refresh(athlete)

    return athlete

@router.get(
    "/profile",
    response_model=AthleteProfileResponse
)
def get_profile(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user = db.query(User).filter(
        User.email == current_user["sub"]
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    profile = db.query(AthleteProfile).filter(
        AthleteProfile.user_id == user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )

    return profile

@router.put(
    "/profile",
    response_model=AthleteProfileResponse
)
def update_profile(
    profile_data: AthleteProfileUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    user = db.query(User).filter(
        User.email == current_user["sub"]
    ).first()

    profile = db.query(AthleteProfile).filter(
        AthleteProfile.user_id == user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )

    profile.age = profile_data.age
    profile.gender = profile_data.gender
    profile.height = profile_data.height
    profile.weight = profile_data.weight
    profile.sport = profile_data.sport
    profile.experience = profile_data.experience
    profile.position = profile_data.position

    db.commit()
    db.refresh(profile)

    return profile

@router.delete("/profile")
def delete_profile(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user = db.query(User).filter(
        User.email == current_user["sub"]
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    profile = db.query(AthleteProfile).filter(
        AthleteProfile.user_id == user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )

    db.delete(profile)
    db.commit()

    return {
        "message": "Profile deleted successfully"
    }