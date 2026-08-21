from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.connection import get_db

from app.models.user import User
from app.models.coach_profile import CoachProfile

from app.schemas.coach_profile_schema import (
    CoachProfileCreate,
    CoachProfileUpdate,
    CoachProfileResponse,
)

from app.utils.roles import require_role


router = APIRouter(
    prefix="/coach",
    tags=["Coach"],
)


def get_coach_user(
    db: Session,
    current_user: dict,
) -> User:
    email = current_user.get("sub")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        )

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    return user


def get_coach_profile(
    db: Session,
    user_id: int,
) -> CoachProfile:
    profile = (
        db.query(CoachProfile)
        .filter(
            CoachProfile.user_id == user_id
        )
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coach profile not found.",
        )

    return profile


@router.get("/")
def coach_home(
    current_user: dict = Depends(
        require_role("coach")
    ),
):
    return {
        "message": "Coach Router Working",
        "role": current_user.get("role"),
    }


@router.post(
    "/profile",
    response_model=CoachProfileResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_profile(
    profile_data: CoachProfileCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role("coach")
    ),
):
    user = get_coach_user(
        db,
        current_user,
    )

    existing = (
        db.query(CoachProfile)
        .filter(
            CoachProfile.user_id == user.id
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Coach profile already exists.",
        )

    profile = CoachProfile(
        user_id=user.id,
        full_name=profile_data.full_name,
        phone=profile_data.phone,
        specialization=profile_data.specialization,
        sport=profile_data.sport,
        experience=profile_data.experience,
        organization=profile_data.organization,
        certification=profile_data.certification,
    )

    try:
        db.add(profile)
        db.commit()
        db.refresh(profile)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to create coach profile.",
        )

    return profile


@router.get(
    "/profile",
    response_model=CoachProfileResponse,
)
def get_profile(
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role("coach")
    ),
):
    user = get_coach_user(
        db,
        current_user,
    )

    return get_coach_profile(
        db,
        user.id,
    )


@router.put(
    "/profile",
    response_model=CoachProfileResponse,
)
def update_profile(
    profile_data: CoachProfileUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role("coach")
    ),
):
    user = get_coach_user(
        db,
        current_user,
    )

    profile = get_coach_profile(
        db,
        user.id,
    )

    update_data = profile_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(
            profile,
            field,
            value,
        )

    try:
        db.commit()
        db.refresh(profile)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to update coach profile.",
        )

    return profile


@router.delete("/profile")
def delete_profile(
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role("coach")
    ),
):
    user = get_coach_user(
        db,
        current_user,
    )

    profile = get_coach_profile(
        db,
        user.id,
    )

    try:
        db.delete(profile)
        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete coach profile.",
        )

    return {
        "message": "Coach profile deleted successfully."
    }