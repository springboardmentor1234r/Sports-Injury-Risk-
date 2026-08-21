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
from app.models.physiotherapist_profile import (
    PhysiotherapistProfile,
)

from app.schemas.physiotherapist_profile_schema import (
    PhysiotherapistProfileCreate,
    PhysiotherapistProfileUpdate,
    PhysiotherapistProfileResponse,
)

from app.utils.roles import require_role


router = APIRouter(
    prefix="/physiotherapist",
    tags=["Physiotherapist"],
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
) -> PhysiotherapistProfile:
    profile = (
        db.query(PhysiotherapistProfile)
        .filter(
            PhysiotherapistProfile.user_id == user_id
        )
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physiotherapist profile not found.",
        )

    return profile


@router.get("/")
def physiotherapist_home(
    current_user: dict = Depends(
        require_role("physiotherapist")
    ),
):
    return {
        "message": "Physiotherapist Router Working",
        "role": current_user.get("role"),
    }


@router.post(
    "/profile",
    response_model=PhysiotherapistProfileResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_profile(
    profile_data: PhysiotherapistProfileCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role("physiotherapist")
    ),
):
    user = get_user(
        db,
        current_user,
    )

    existing = (
        db.query(PhysiotherapistProfile)
        .filter(
            PhysiotherapistProfile.user_id == user.id
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Physiotherapist profile "
                "already exists."
            ),
        )

    profile = PhysiotherapistProfile(
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
                "physiotherapist profile."
            ),
        )

    return profile


@router.get(
    "/profile",
    response_model=PhysiotherapistProfileResponse,
)
def get_profile(
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role("physiotherapist")
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
    response_model=PhysiotherapistProfileResponse,
)
def update_profile(
    profile_data: PhysiotherapistProfileUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role("physiotherapist")
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
                "physiotherapist profile."
            ),
        )

    return profile


@router.delete("/profile")
def delete_profile(
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role("physiotherapist")
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
                "physiotherapist profile."
            ),
        )

    return {
        "message": (
            "Physiotherapist profile "
            "deleted successfully."
        )
    }