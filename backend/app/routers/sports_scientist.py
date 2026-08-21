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
from app.models.sports_scientist_profile import (
    SportsScientistProfile,
)

from app.schemas.sports_scientist_profile_schema import (
    SportsScientistProfileCreate,
    SportsScientistProfileUpdate,
    SportsScientistProfileResponse,
)

from app.utils.roles import require_role


router = APIRouter(
    prefix="/sports-scientist",
    tags=["Sports Scientist"],
)


def get_user(
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


def get_profile_by_user(
    db: Session,
    user_id: int,
) -> SportsScientistProfile:
    profile = (
        db.query(SportsScientistProfile)
        .filter(
            SportsScientistProfile.user_id == user_id
        )
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sports scientist profile not found.",
        )

    return profile


@router.get("/")
def sports_scientist_home(
    current_user: dict = Depends(
        require_role("sports_scientist")
    ),
):
    return {
        "message": "Sports Scientist Router Working",
        "role": current_user.get("role"),
    }


@router.post(
    "/profile",
    response_model=SportsScientistProfileResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_profile(
    profile_data: SportsScientistProfileCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role("sports_scientist")
    ),
):
    user = get_user(
        db,
        current_user,
    )

    existing = (
        db.query(SportsScientistProfile)
        .filter(
            SportsScientistProfile.user_id == user.id
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Sports scientist profile "
                "already exists."
            ),
        )

    profile = SportsScientistProfile(
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
            detail=(
                "Unable to create "
                "sports scientist profile."
            ),
        )

    return profile


@router.get(
    "/profile",
    response_model=SportsScientistProfileResponse,
)
def get_profile(
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role("sports_scientist")
    ),
):
    user = get_user(
        db,
        current_user,
    )

    return get_profile_by_user(
        db,
        user.id,
    )


@router.put(
    "/profile",
    response_model=SportsScientistProfileResponse,
)
def update_profile(
    profile_data: SportsScientistProfileUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role("sports_scientist")
    ),
):
    user = get_user(
        db,
        current_user,
    )

    profile = get_profile_by_user(
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
            detail=(
                "Unable to update "
                "sports scientist profile."
            ),
        )

    return profile


@router.delete("/profile")
def delete_profile(
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role("sports_scientist")
    ),
):
    user = get_user(
        db,
        current_user,
    )

    profile = get_profile_by_user(
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
            detail=(
                "Unable to delete "
                "sports scientist profile."
            ),
        )

    return {
        "message": (
            "Sports scientist profile "
            "deleted successfully."
        )
    }