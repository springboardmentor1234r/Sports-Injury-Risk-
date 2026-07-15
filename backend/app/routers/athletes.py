from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, AthleteProfile, InjuryRecord, RoleEnum
from app.schemas import (
    AthleteProfileOut,
    AthleteProfileUpdate,
    AthleteProfileWithUser,
    InjuryRecordCreate,
    InjuryRecordOut,
)
from app.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/api/athletes", tags=["Athlete Profiles"])

STAFF_ROLES = (
    RoleEnum.coach,
    RoleEnum.physiotherapist,
    RoleEnum.sports_scientist,
    RoleEnum.administrator,
)


def _get_profile_or_404(db: Session, profile_id: int) -> AthleteProfile:
    profile = db.query(AthleteProfile).filter(AthleteProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Athlete profile not found")
    return profile


def _ensure_can_view_or_edit(current_user: User, profile: AthleteProfile):
    is_owner = profile.user_id == current_user.id
    is_staff = current_user.role in STAFF_ROLES
    if not (is_owner or is_staff):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this athlete's profile",
        )


@router.get("/me", response_model=AthleteProfileOut)
def get_my_profile(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    profile = (
        db.query(AthleteProfile)
        .filter(AthleteProfile.user_id == current_user.id)
        .first()
    )
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="No athlete profile exists for this account (are you registered as an athlete?)",
        )
    return profile


@router.put("/me", response_model=AthleteProfileOut)
def update_my_profile(
    payload: AthleteProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = (
        db.query(AthleteProfile)
        .filter(AthleteProfile.user_id == current_user.id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Athlete profile not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile


@router.get("", response_model=List[AthleteProfileWithUser])
def list_athletes(
    current_user: User = Depends(require_roles(*STAFF_ROLES)),
    db: Session = Depends(get_db),
):
    """Coaches, physios, sports scientists and admins can list all athletes."""
    return db.query(AthleteProfile).all()


@router.get("/{profile_id}", response_model=AthleteProfileWithUser)
def get_athlete_profile(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = _get_profile_or_404(db, profile_id)
    _ensure_can_view_or_edit(current_user, profile)
    return profile


@router.post(
    "/{profile_id}/injuries",
    response_model=InjuryRecordOut,
    status_code=status.HTTP_201_CREATED,
)
def add_injury_record(
    profile_id: int,
    payload: InjuryRecordCreate,
    current_user: User = Depends(
        require_roles(
            RoleEnum.physiotherapist, RoleEnum.sports_scientist, RoleEnum.administrator
        )
    ),
    db: Session = Depends(get_db),
):
    profile = _get_profile_or_404(db, profile_id)
    record = InjuryRecord(athlete_profile_id=profile.id, **payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/{profile_id}/injuries", response_model=List[InjuryRecordOut])
def list_injury_records(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = _get_profile_or_404(db, profile_id)
    _ensure_can_view_or_edit(current_user, profile)
    return profile.injury_history
