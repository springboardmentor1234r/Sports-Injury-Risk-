"""
routers/athletes.py
---------------------
Athlete profile management.

Milestone 1 access rules (deliberately simple — will be revisited later
once real team/organization scoping is defined):

  - athlete             -> can view and edit ONLY their own profile
  - coach / physiotherapist / sports_scientist / admin
                         -> can view the list of all athletes and any
                            single athlete's profile
  - admin                -> can additionally edit any athlete's profile
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/athletes", tags=["Athlete Profiles"])


def _get_profile_or_404(db: Session, profile_id: uuid.UUID) -> models.AthleteProfile:
    profile = db.query(models.AthleteProfile).filter(models.AthleteProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Athlete profile not found")
    return profile


@router.get("/me", response_model=schemas.AthleteProfileOut)
def get_my_profile(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != models.UserRole.athlete:
        raise HTTPException(status_code=400, detail="Only athletes have an athlete profile")
    return current_user.athlete_profile


@router.put("/me", response_model=schemas.AthleteProfileOut)
def update_my_profile(
    updates: schemas.AthleteProfileUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != models.UserRole.athlete:
        raise HTTPException(status_code=400, detail="Only athletes have an athlete profile")

    profile = current_user.athlete_profile
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile


@router.get("", response_model=list[schemas.AthleteProfileWithUser])
def list_athletes(
    current_user: models.User = Depends(
        auth.require_roles(
            models.UserRole.coach,
            models.UserRole.physiotherapist,
            models.UserRole.sports_scientist,
            models.UserRole.admin,
        )
    ),
    db: Session = Depends(get_db),
):
    return db.query(models.AthleteProfile).all()


@router.get("/{profile_id}", response_model=schemas.AthleteProfileWithUser)
def get_athlete(
    profile_id: uuid.UUID,
    current_user: models.User = Depends(
        auth.require_roles(
            models.UserRole.coach,
            models.UserRole.physiotherapist,
            models.UserRole.sports_scientist,
            models.UserRole.admin,
        )
    ),
    db: Session = Depends(get_db),
):
    return _get_profile_or_404(db, profile_id)


@router.put("/{profile_id}", response_model=schemas.AthleteProfileOut)
def update_athlete(
    profile_id: uuid.UUID,
    updates: schemas.AthleteProfileUpdate,
    current_user: models.User = Depends(auth.require_roles(models.UserRole.admin)),
    db: Session = Depends(get_db),
):
    profile = _get_profile_or_404(db, profile_id)
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile
