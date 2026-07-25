"""
routers/injuries.py
---------------------
Structured injury history for an athlete.

Write access: physiotherapist, admin only (clinical data).
Read access: the athlete themself (own records), plus coach/physiotherapist/
             sports_scientist/admin for any athlete.
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.auth import get_current_user
from app.permissions import require_profile_read_access, require_roles_for_write, get_athlete_profile_or_404

router = APIRouter(prefix="/athletes/{profile_id}/injuries", tags=["Injury Records"])

WRITE_ROLES = (models.UserRole.physiotherapist, models.UserRole.admin)


@router.get("", response_model=list[schemas.InjuryRecordOut])
def list_injuries(
    profile: models.AthleteProfile = Depends(require_profile_read_access),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.InjuryRecord)
        .filter(models.InjuryRecord.athlete_profile_id == profile.id)
        .order_by(models.InjuryRecord.date_occurred.desc())
        .all()
    )


@router.post("", response_model=schemas.InjuryRecordOut, status_code=201)
def create_injury(
    profile_id: uuid.UUID,
    payload: schemas.InjuryRecordCreate,
    current_user: models.User = Depends(require_roles_for_write(*WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    profile = get_athlete_profile_or_404(db, profile_id)
    record = models.InjuryRecord(
        **payload.model_dump(),
        athlete_profile_id=profile.id,
        recorded_by_user_id=current_user.id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put("/{injury_id}", response_model=schemas.InjuryRecordOut)
def update_injury(
    profile_id: uuid.UUID,
    injury_id: uuid.UUID,
    payload: schemas.InjuryRecordUpdate,
    current_user: models.User = Depends(require_roles_for_write(*WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    get_athlete_profile_or_404(db, profile_id)
    record = (
        db.query(models.InjuryRecord)
        .filter(models.InjuryRecord.id == injury_id, models.InjuryRecord.athlete_profile_id == profile_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Injury record not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)
    return record


@router.delete("/{injury_id}", status_code=204)
def delete_injury(
    profile_id: uuid.UUID,
    injury_id: uuid.UUID,
    current_user: models.User = Depends(require_roles_for_write(*WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    get_athlete_profile_or_404(db, profile_id)
    record = (
        db.query(models.InjuryRecord)
        .filter(models.InjuryRecord.id == injury_id, models.InjuryRecord.athlete_profile_id == profile_id)
        .first()
    )
    if record:
        db.delete(record)
        db.commit()
    return None
