from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/athletes", tags=["Athlete Profile Management"])


@router.get("/me", response_model=schemas.AthleteProfileOut)
def get_my_profile(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    profile = (
        db.query(models.AthleteProfile)
        .filter(models.AthleteProfile.user_id == current_user.id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Athlete profile not found")
    return profile


@router.put("/me", response_model=schemas.AthleteProfileOut)
def update_my_profile(
    profile_in: schemas.AthleteProfileUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    profile = (
        db.query(models.AthleteProfile)
        .filter(models.AthleteProfile.user_id == current_user.id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Athlete profile not found")

    for field, value in profile_in.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile


@router.get("", response_model=list[schemas.AthleteProfileOut])
def list_all_athletes(
    current_user: models.User = Depends(
        auth.require_roles(["coach", "physiotherapist", "sports_scientist", "administrator"])
    ),
    db: Session = Depends(get_db),
):
    """Only coaches, physios, sports scientists, and admins can view all athletes."""
    return db.query(models.AthleteProfile).all()


@router.get("/{athlete_id}", response_model=schemas.AthleteProfileOut)
def get_athlete_by_id(
    athlete_id: int,
    current_user: models.User = Depends(
        auth.require_roles(["coach", "physiotherapist", "sports_scientist", "administrator"])
    ),
    db: Session = Depends(get_db),
):
    profile = db.query(models.AthleteProfile).filter(models.AthleteProfile.id == athlete_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Athlete not found")
    return profile
