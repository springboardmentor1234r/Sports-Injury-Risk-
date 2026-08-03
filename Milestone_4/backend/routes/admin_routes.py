from typing import List
from collections import Counter

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User, Athlete, AthleteAssignment, Video, PoseFrame, InjuryRiskAssessment
from schemas import (
    UserOut,
    AthleteWithOwnerOut,
    AssignmentCreate,
    AssignmentOut,
    PlatformAnalyticsOut,
    SystemMonitoringOut,
)
from auth import get_current_user_and_role
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["Admin"])


def _require_admin(role: str):
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin access only.")


@router.get("/users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), user_and_role=Depends(get_current_user_and_role)):
    _, role = user_and_role
    _require_admin(role)
    return db.query(User).order_by(User.name).all()


@router.get("/athletes", response_model=List[AthleteWithOwnerOut])
def list_athletes(db: Session = Depends(get_db), user_and_role=Depends(get_current_user_and_role)):
    _, role = user_and_role
    _require_admin(role)

    results = []
    for athlete in db.query(Athlete).all():
        owner = db.query(User).filter(User.id == athlete.user_id).first()
        if not owner:
            continue
        results.append(
            {
                "athlete_id": athlete.athlete_id,
                "user_id": athlete.user_id,
                "owner_name": owner.name,
                "owner_email": owner.email,
                "sport": athlete.sport,
                "position": athlete.position,
                "age": athlete.age,
                "height": athlete.height,
                "weight": athlete.weight,
                "injury_history": athlete.injury_history,
                "training_load": athlete.training_load,
            }
        )
    return results


@router.get("/assignments", response_model=List[AssignmentOut])
def list_assignments(db: Session = Depends(get_db), user_and_role=Depends(get_current_user_and_role)):
    _, role = user_and_role
    _require_admin(role)

    results = []
    for a in db.query(AthleteAssignment).order_by(AthleteAssignment.assigned_at.desc()).all():
        staff = db.query(User).filter(User.id == a.staff_user_id).first()
        athlete = db.query(Athlete).filter(Athlete.athlete_id == a.athlete_id).first()
        if not staff or not athlete:
            continue
        athlete_owner = db.query(User).filter(User.id == athlete.user_id).first()
        results.append(
            {
                "id": a.id,
                "staff_user_id": a.staff_user_id,
                "staff_name": staff.name,
                "staff_role": staff.role,
                "athlete_id": a.athlete_id,
                "athlete_name": athlete_owner.name if athlete_owner else "Unknown",
                "assigned_at": a.assigned_at,
            }
        )
    return results


@router.post("/assign", response_model=AssignmentOut)
def create_assignment(
    data: AssignmentCreate,
    db: Session = Depends(get_db),
    user_and_role=Depends(get_current_user_and_role),
):
    _, role = user_and_role
    _require_admin(role)

    staff = db.query(User).filter(User.id == data.staff_user_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff user not found")
    if staff.role not in ("coach", "physiotherapist", "sports_scientist"):
        raise HTTPException(
            status_code=400,
            detail="Selected user is not a coach, physiotherapist, or sports scientist.",
        )

    athlete = db.query(Athlete).filter(Athlete.athlete_id == data.athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    existing = (
        db.query(AthleteAssignment)
        .filter(
            AthleteAssignment.staff_user_id == data.staff_user_id,
            AthleteAssignment.athlete_id == data.athlete_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="This athlete is already assigned to this staff member.")

    assignment = AthleteAssignment(staff_user_id=data.staff_user_id, athlete_id=data.athlete_id)
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    athlete_owner = db.query(User).filter(User.id == athlete.user_id).first()
    return {
        "id": assignment.id,
        "staff_user_id": assignment.staff_user_id,
        "staff_name": staff.name,
        "staff_role": staff.role,
        "athlete_id": assignment.athlete_id,
        "athlete_name": athlete_owner.name if athlete_owner else "Unknown",
        "assigned_at": assignment.assigned_at,
    }


@router.delete("/assign/{assignment_id}")
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    user_and_role=Depends(get_current_user_and_role),
):
    _, role = user_and_role
    _require_admin(role)

    assignment = db.query(AthleteAssignment).filter(AthleteAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    db.delete(assignment)
    db.commit()
    return {"message": "Assignment removed"}


# ---------------------------------------------------------------------------
# Milestone 4 — Admin Dashboard "Platform analytics" + "System monitoring"
# (PDF section 10 Admin Dashboard, and section 4 "Build executive dashboards")
# ---------------------------------------------------------------------------

@router.get("/platform-analytics", response_model=PlatformAnalyticsOut)
def get_platform_analytics(
    db: Session = Depends(get_db), user_and_role=Depends(get_current_user_and_role)
):
    _, role = user_and_role
    _require_admin(role)

    users = db.query(User).all()
    users_by_role = dict(Counter(u.role for u in users))

    videos = db.query(Video).all()
    videos_by_status = dict(Counter(v.status for v in videos))

    assessments = db.query(InjuryRiskAssessment).all()
    risk_category_distribution = dict(
        Counter(a.risk_category for a in assessments if a.risk_category)
    )
    scores = [a.overall_injury_risk_score for a in assessments if a.overall_injury_risk_score is not None]
    avg_score = round(sum(scores) / len(scores), 2) if scores else None

    return PlatformAnalyticsOut(
        total_users=len(users),
        users_by_role=users_by_role,
        total_athletes=db.query(Athlete).count(),
        total_videos=len(videos),
        videos_by_status=videos_by_status,
        total_risk_assessments=len(assessments),
        risk_category_distribution=risk_category_distribution,
        avg_overall_injury_risk_score=avg_score,
    )


@router.get("/system-monitoring", response_model=SystemMonitoringOut)
def get_system_monitoring(
    db: Session = Depends(get_db), user_and_role=Depends(get_current_user_and_role)
):
    _, role = user_and_role
    _require_admin(role)

    database_connected = True
    try:
        db.query(User).first()
    except Exception:  # noqa: BLE001
        database_connected = False

    videos_processing = db.query(Video).filter(Video.status == "processing").count()
    videos_failed = db.query(Video).filter(Video.status == "failed").count()
    total_pose_frames = db.query(PoseFrame).count()

    return SystemMonitoringOut(
        status="healthy" if database_connected and videos_failed == 0 else "degraded",
        database_connected=database_connected,
        videos_processing=videos_processing,
        videos_failed=videos_failed,
        total_pose_frames_tracked=total_pose_frames,
        generated_at=datetime.utcnow(),
    )
