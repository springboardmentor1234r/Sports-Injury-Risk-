"""
routers/performance.py
------------------------
Point-in-time performance test results (sprint times, jump height, etc.).

Write access: coach, sports_scientist, admin.
Read access: the athlete themself (own records), plus all staff roles.
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.permissions import require_profile_read_access, require_roles_for_write, get_athlete_profile_or_404

router = APIRouter(prefix="/athletes/{profile_id}/performance", tags=["Performance Metrics"])

WRITE_ROLES = (models.UserRole.coach, models.UserRole.sports_scientist, models.UserRole.admin)


@router.get("", response_model=list[schemas.PerformanceMetricOut])
def list_performance_metrics(
    profile: models.AthleteProfile = Depends(require_profile_read_access),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.PerformanceMetric)
        .filter(models.PerformanceMetric.athlete_profile_id == profile.id)
        .order_by(models.PerformanceMetric.recorded_date.desc())
        .all()
    )


@router.post("", response_model=schemas.PerformanceMetricOut, status_code=201)
def create_performance_metric(
    profile_id: uuid.UUID,
    payload: schemas.PerformanceMetricCreate,
    current_user: models.User = Depends(require_roles_for_write(*WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    profile = get_athlete_profile_or_404(db, profile_id)
    record = models.PerformanceMetric(
        **payload.model_dump(),
        athlete_profile_id=profile.id,
        recorded_by_user_id=current_user.id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{metric_id}", status_code=204)
def delete_performance_metric(
    profile_id: uuid.UUID,
    metric_id: uuid.UUID,
    current_user: models.User = Depends(require_roles_for_write(*WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    get_athlete_profile_or_404(db, profile_id)
    record = (
        db.query(models.PerformanceMetric)
        .filter(models.PerformanceMetric.id == metric_id, models.PerformanceMetric.athlete_profile_id == profile_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Performance metric not found")
    db.delete(record)
    db.commit()
    return None
