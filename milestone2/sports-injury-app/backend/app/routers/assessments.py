"""
routers/assessments.py
------------------------
Periodic clinical/screening assessments (pre-season screening, return-to-play
clearance, etc.).

Write access: physiotherapist, sports_scientist, admin.
Read access: the athlete themself (own records), plus all staff roles.
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.permissions import require_profile_read_access, require_roles_for_write, get_athlete_profile_or_404

router = APIRouter(prefix="/athletes/{profile_id}/assessments", tags=["Physical Assessments"])

WRITE_ROLES = (models.UserRole.physiotherapist, models.UserRole.sports_scientist, models.UserRole.admin)


@router.get("", response_model=list[schemas.PhysicalAssessmentOut])
def list_assessments(
    profile: models.AthleteProfile = Depends(require_profile_read_access),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.PhysicalAssessment)
        .filter(models.PhysicalAssessment.athlete_profile_id == profile.id)
        .order_by(models.PhysicalAssessment.assessment_date.desc())
        .all()
    )


@router.post("", response_model=schemas.PhysicalAssessmentOut, status_code=201)
def create_assessment(
    profile_id: uuid.UUID,
    payload: schemas.PhysicalAssessmentCreate,
    current_user: models.User = Depends(require_roles_for_write(*WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    profile = get_athlete_profile_or_404(db, profile_id)
    record = models.PhysicalAssessment(
        **payload.model_dump(),
        athlete_profile_id=profile.id,
        assessor_user_id=current_user.id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{assessment_id}", status_code=204)
def delete_assessment(
    profile_id: uuid.UUID,
    assessment_id: uuid.UUID,
    current_user: models.User = Depends(require_roles_for_write(*WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    get_athlete_profile_or_404(db, profile_id)
    record = (
        db.query(models.PhysicalAssessment)
        .filter(models.PhysicalAssessment.id == assessment_id, models.PhysicalAssessment.athlete_profile_id == profile_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Assessment not found")
    db.delete(record)
    db.commit()
    return None
