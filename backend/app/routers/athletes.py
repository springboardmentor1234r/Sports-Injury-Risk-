from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import auth, models, schemas
from ..database import get_db

router = APIRouter(prefix="/athletes", tags=["Athletes"])
STAFF_ROLES = ["coach", "physiotherapist", "sports_scientist", "administrator"]


def profile_summary(profile: models.AthleteProfile) -> dict:
    completed = [analysis for analysis in profile.analyses if analysis.result]
    latest = max(completed, key=lambda analysis: analysis.processed_at or analysis.created_at) if completed else None
    return {"id": profile.id, "user_id": profile.user_id, "sport_type": profile.sport_type, "position": profile.position, "age": profile.age, "height_cm": profile.height_cm, "weight_kg": profile.weight_kg, "injury_history": profile.injury_history, "training_load": profile.training_load, "created_at": profile.created_at, "updated_at": profile.updated_at, "full_name": profile.user.full_name, "email": profile.user.email, "latest_risk": latest.result.overall_risk if latest else None, "risk_level": latest.result.risk_level if latest else None, "last_analysis_at": latest.processed_at if latest else None}


@router.get("/me", response_model=schemas.AthleteProfileOut)
def get_my_profile(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if current_user.role != models.RoleEnum.athlete:
        raise HTTPException(status_code=403, detail="Only athlete accounts have athlete profiles")
    profile = db.query(models.AthleteProfile).filter(models.AthleteProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Athlete profile not found")
    return profile


@router.put("/me", response_model=schemas.AthleteProfileOut)
def update_my_profile(profile_in: schemas.AthleteProfileUpdate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if current_user.role != models.RoleEnum.athlete:
        raise HTTPException(status_code=403, detail="Only athlete accounts can update athlete profiles")
    profile = db.query(models.AthleteProfile).filter(models.AthleteProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Athlete profile not found")
    for field, value in profile_in.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("", response_model=list[schemas.AthleteSummary])
def list_all_athletes(current_user: models.User = Depends(auth.require_roles(STAFF_ROLES)), db: Session = Depends(get_db)):
    profiles = db.query(models.AthleteProfile).options(joinedload(models.AthleteProfile.user), joinedload(models.AthleteProfile.analyses).joinedload(models.VideoAnalysis.result)).all()
    return [profile_summary(profile) for profile in profiles]


@router.get("/{athlete_id}", response_model=schemas.AthleteSummary)
def get_athlete_by_id(athlete_id: int, current_user: models.User = Depends(auth.require_roles(STAFF_ROLES)), db: Session = Depends(get_db)):
    profile = db.query(models.AthleteProfile).options(joinedload(models.AthleteProfile.user), joinedload(models.AthleteProfile.analyses).joinedload(models.VideoAnalysis.result)).filter(models.AthleteProfile.id == athlete_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Athlete not found")
    return profile_summary(profile)
