"""
routers/training_load.py
--------------------------
Per-session training load entries.

Write access is slightly different from the other three modules: an athlete
is allowed to log their OWN sessions (self-reported RPE is standard practice
in sports science), and a coach/admin can log entries for any athlete on
their roster. Read access follows the usual pattern: owner + all staff roles.
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.auth import get_current_user
from app.permissions import require_profile_read_access, get_athlete_profile_or_404

router = APIRouter(prefix="/athletes/{profile_id}/training-load", tags=["Training Load"])


def _require_write_access(profile_id: uuid.UUID, current_user: models.User, db: Session) -> models.AthleteProfile:
    profile = get_athlete_profile_or_404(db, profile_id)
    is_owner = current_user.role == models.UserRole.athlete and profile.user_id == current_user.id
    is_coach_or_admin = current_user.role in (models.UserRole.coach, models.UserRole.admin)
    if not (is_owner or is_coach_or_admin):
        raise HTTPException(status_code=403, detail="Only the athlete themself, their coach, or an admin can log training load")
    return profile


@router.get("", response_model=list[schemas.TrainingLoadEntryOut])
def list_training_load(
    profile: models.AthleteProfile = Depends(require_profile_read_access),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.TrainingLoadEntry)
        .filter(models.TrainingLoadEntry.athlete_profile_id == profile.id)
        .order_by(models.TrainingLoadEntry.session_date.desc())
        .all()
    )


@router.post("", response_model=schemas.TrainingLoadEntryOut, status_code=201)
def create_training_load_entry(
    profile_id: uuid.UUID,
    payload: schemas.TrainingLoadEntryCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = _require_write_access(profile_id, current_user, db)
    record = models.TrainingLoadEntry(
        **payload.model_dump(),
        athlete_profile_id=profile.id,
        recorded_by_user_id=current_user.id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{entry_id}", status_code=204)
def delete_training_load_entry(
    profile_id: uuid.UUID,
    entry_id: uuid.UUID,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_write_access(profile_id, current_user, db)
    record = (
        db.query(models.TrainingLoadEntry)
        .filter(models.TrainingLoadEntry.id == entry_id, models.TrainingLoadEntry.athlete_profile_id == profile_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Training load entry not found")
    db.delete(record)
    db.commit()
    return None
