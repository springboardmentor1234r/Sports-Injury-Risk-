from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.athlete_profile import AthleteProfile
from app.models.user import User
from app.schemas.athlete_profile_schema import (
    AthleteProfileCreate,
    AthleteProfileUpdate,
    AthleteProfileResponse,
)
from app.utils.dependencies import get_current_user
from app.utils.roles import require_role


router = APIRouter(
    prefix="/athlete",
    tags=["Athlete"],
)


def get_athlete_user(
    db: Session,
    current_user: dict,
) -> User:
    email = current_user.get("sub")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


@router.post(
    "/profile",
    response_model=AthleteProfileResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_profile(
    profile: AthleteProfileCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role("athlete")
    ),
):
    user = get_athlete_user(
        db,
        current_user,
    )

    existing_profile = (
        db.query(AthleteProfile)
        .filter(
            AthleteProfile.user_id == user.id
        )
        .first()
    )

    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Athlete profile already exists",
        )

    athlete = AthleteProfile(
        user_id=user.id,
        full_name=profile.full_name,
        age=profile.age,
        gender=profile.gender,
        height=profile.height,
        weight=profile.weight,
        sport=profile.sport,
        experience_years=profile.experience_years,
        position=profile.position,
    )

    try:
        db.add(athlete)
        db.commit()
        db.refresh(athlete)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to create athlete profile",
        )

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create athlete profile",
        )

    return athlete


@router.get(
    "/profile",
    response_model=AthleteProfileResponse,
)
def get_profile(
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role("athlete")
    ),
):
    user = get_athlete_user(
        db,
        current_user,
    )

    profile = (
        db.query(AthleteProfile)
        .filter(
            AthleteProfile.user_id == user.id
        )
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete profile not found",
        )

    return profile


@router.put(
    "/profile",
    response_model=AthleteProfileResponse,
)
def update_profile(
    profile_data: AthleteProfileUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role("athlete")
    ),
):
    user = get_athlete_user(
        db,
        current_user,
    )

    profile = (
        db.query(AthleteProfile)
        .filter(
            AthleteProfile.user_id == user.id
        )
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete profile not found",
        )

    update_data = profile_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(
            profile,
            field,
            value
        )

    try:
        db.commit()
        db.refresh(profile)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to update athlete profile",
        )

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update athlete profile",
        )

    return profile


@router.delete("/profile")
def delete_profile(
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role("athlete")
    ),
):
    user = get_athlete_user(
        db,
        current_user,
    )

    profile = (
        db.query(AthleteProfile)
        .filter(
            AthleteProfile.user_id == user.id
        )
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete profile not found",
        )

    try:
        db.delete(profile)
        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete athlete profile",
        )

    return {
        "message": "Athlete profile deleted successfully"
    }