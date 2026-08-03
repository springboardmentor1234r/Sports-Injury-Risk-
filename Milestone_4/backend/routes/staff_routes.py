from typing import List
from collections import Counter

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Athlete, AthleteAssignment, User, Video, PoseFrame, BiomechanicsReport, InjuryRiskAssessment
from schemas import (
    AthleteWithOwnerOut,
    VideoOut,
    PoseFrameOut,
    BiomechanicsReportOut,
    InjuryRiskAssessmentOut,
    TeamRiskOverviewItem,
    StaffAnalyticsOverviewOut,
)
from auth import get_current_user_and_role

router = APIRouter(prefix="/staff", tags=["Staff (Coach / Physiotherapist / Sports Scientist)"])

STAFF_ROLES = {"coach", "physiotherapist", "sports_scientist"}


def _require_staff_or_admin(role: str):
    if role not in STAFF_ROLES and role != "admin":
        raise HTTPException(
            status_code=403,
            detail="This endpoint is for coach, physiotherapist, sports scientist, or admin accounts only.",
        )


def _verify_access(db: Session, user_id: int, role: str, athlete_id: int):
    """Admins can see everyone; other staff must have an explicit assignment."""
    if role == "admin":
        return
    assigned = (
        db.query(AthleteAssignment)
        .filter(
            AthleteAssignment.staff_user_id == user_id,
            AthleteAssignment.athlete_id == athlete_id,
        )
        .first()
    )
    if not assigned:
        raise HTTPException(status_code=403, detail="You are not assigned to this athlete.")


def _athlete_to_dict(athlete: Athlete, owner: User) -> dict:
    return {
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


@router.get("/my-athletes", response_model=List[AthleteWithOwnerOut])
def get_my_athletes(
    db: Session = Depends(get_db),
    user_and_role=Depends(get_current_user_and_role),
):
    """Athletes assigned to the logged-in coach/physio/sports scientist.
    (Admins use /admin/athletes to browse everyone instead.)"""
    user_id, role = user_and_role
    _require_staff_or_admin(role)

    assignments = (
        db.query(AthleteAssignment).filter(AthleteAssignment.staff_user_id == user_id).all()
    )

    results = []
    for a in assignments:
        athlete = db.query(Athlete).filter(Athlete.athlete_id == a.athlete_id).first()
        if not athlete:
            continue
        owner = db.query(User).filter(User.id == athlete.user_id).first()
        if not owner:
            continue
        results.append(_athlete_to_dict(athlete, owner))
    return results


@router.get("/team-risk-overview", response_model=List[TeamRiskOverviewItem])
def get_team_risk_overview(
    db: Session = Depends(get_db),
    user_and_role=Depends(get_current_user_and_role),
):
    """Milestone 3 — Coach Dashboard 'Team risk overview' (PDF section 10).
    Admins see every athlete; coach/physio/sports_scientist see only theirs."""
    user_id, role = user_and_role
    _require_staff_or_admin(role)

    if role == "admin":
        athletes = db.query(Athlete).all()
    else:
        assignments = (
            db.query(AthleteAssignment).filter(AthleteAssignment.staff_user_id == user_id).all()
        )
        athlete_ids = [a.athlete_id for a in assignments]
        athletes = (
            db.query(Athlete).filter(Athlete.athlete_id.in_(athlete_ids)).all()
            if athlete_ids
            else []
        )

    results = []
    for athlete in athletes:
        owner = db.query(User).filter(User.id == athlete.user_id).first()
        if not owner:
            continue

        videos = (
            db.query(Video)
            .filter(Video.athlete_id == athlete.athlete_id, Video.status == "completed")
            .order_by(Video.uploaded_at.desc())
            .all()
        )

        latest_score, latest_category = None, None
        analyzed_count = 0
        for v in videos:
            assessment = (
                db.query(InjuryRiskAssessment).filter(InjuryRiskAssessment.video_id == v.id).first()
            )
            if not assessment:
                continue
            analyzed_count += 1
            if latest_score is None:
                latest_score = assessment.overall_injury_risk_score
                latest_category = assessment.risk_category

        results.append(
            TeamRiskOverviewItem(
                athlete_id=athlete.athlete_id,
                owner_name=owner.name,
                sport=athlete.sport,
                latest_risk_score=latest_score,
                latest_risk_category=latest_category,
                videos_analyzed=analyzed_count,
            )
        )
    return results


@router.get("/analytics-overview", response_model=StaffAnalyticsOverviewOut)
def get_staff_analytics_overview(
    db: Session = Depends(get_db),
    user_and_role=Depends(get_current_user_and_role),
):
    """Milestone 4 — the 'executive dashboard' analytics behind the
    Sports Scientist Dashboard (biomechanical analytics / team performance
    trends / injury prediction insights) and the Physiotherapist Dashboard
    (injury risk monitoring / movement correction analytics) from PDF
    section 10. Admins see the whole platform; other staff see only their
    assigned athletes."""
    user_id, role = user_and_role
    _require_staff_or_admin(role)

    if role == "admin":
        athlete_ids = [a.athlete_id for a in db.query(Athlete).all()]
    else:
        assignments = (
            db.query(AthleteAssignment).filter(AthleteAssignment.staff_user_id == user_id).all()
        )
        athlete_ids = [a.athlete_id for a in assignments]

    if not athlete_ids:
        return StaffAnalyticsOverviewOut(
            athletes_covered=0,
            videos_analyzed=0,
            avg_team_risk_score=None,
            team_risk_distribution={},
            avg_movement_quality_score=None,
            avg_knee_valgus_asymmetry=None,
            avg_trunk_lean=None,
            most_common_anomaly_types={},
        )

    videos = (
        db.query(Video)
        .filter(Video.athlete_id.in_(athlete_ids), Video.status == "completed")
        .all()
    )
    video_ids = [v.id for v in videos]

    biomech_reports = (
        db.query(BiomechanicsReport).filter(BiomechanicsReport.video_id.in_(video_ids)).all()
        if video_ids
        else []
    )
    quality_scores = [r.movement_quality_score for r in biomech_reports if r.movement_quality_score is not None]
    valgus_values = [r.knee_valgus_asymmetry for r in biomech_reports if r.knee_valgus_asymmetry is not None]
    trunk_values = [r.avg_trunk_lean for r in biomech_reports if r.avg_trunk_lean is not None]

    assessments = (
        db.query(InjuryRiskAssessment).filter(InjuryRiskAssessment.video_id.in_(video_ids)).all()
        if video_ids
        else []
    )
    risk_scores = [a.overall_injury_risk_score for a in assessments if a.overall_injury_risk_score is not None]
    risk_categories = [a.risk_category for a in assessments if a.risk_category]

    anomaly_type_counter = Counter()
    for a in assessments:
        for anomaly in a.anomalies_detected or []:
            anomaly_type = anomaly.get("type")
            if anomaly_type and anomaly_type not in {"none", "insufficient_data"}:
                anomaly_type_counter[anomaly_type] += 1

    def _avg(values):
        return round(sum(values) / len(values), 2) if values else None

    return StaffAnalyticsOverviewOut(
        athletes_covered=len(athlete_ids),
        videos_analyzed=len(videos),
        avg_team_risk_score=_avg(risk_scores),
        team_risk_distribution=dict(Counter(risk_categories)),
        avg_movement_quality_score=_avg(quality_scores),
        avg_knee_valgus_asymmetry=_avg(valgus_values),
        avg_trunk_lean=_avg(trunk_values),
        most_common_anomaly_types=dict(anomaly_type_counter),
    )


@router.get("/athlete/{athlete_id}", response_model=AthleteWithOwnerOut)
def get_athlete_detail(
    athlete_id: int,
    db: Session = Depends(get_db),
    user_and_role=Depends(get_current_user_and_role),
):
    user_id, role = user_and_role
    _require_staff_or_admin(role)
    _verify_access(db, user_id, role, athlete_id)

    athlete = db.query(Athlete).filter(Athlete.athlete_id == athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")
    owner = db.query(User).filter(User.id == athlete.user_id).first()
    return _athlete_to_dict(athlete, owner)


@router.get("/athlete/{athlete_id}/videos", response_model=List[VideoOut])
def get_athlete_videos(
    athlete_id: int,
    db: Session = Depends(get_db),
    user_and_role=Depends(get_current_user_and_role),
):
    user_id, role = user_and_role
    _require_staff_or_admin(role)
    _verify_access(db, user_id, role, athlete_id)

    return (
        db.query(Video)
        .filter(Video.athlete_id == athlete_id)
        .order_by(Video.uploaded_at.desc())
        .all()
    )


@router.get("/athlete/{athlete_id}/videos/{video_id}/pose-frames", response_model=List[PoseFrameOut])
def get_athlete_video_pose_frames(
    athlete_id: int,
    video_id: int,
    db: Session = Depends(get_db),
    user_and_role=Depends(get_current_user_and_role),
):
    user_id, role = user_and_role
    _require_staff_or_admin(role)
    _verify_access(db, user_id, role, athlete_id)

    video = db.query(Video).filter(Video.id == video_id, Video.athlete_id == athlete_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found for this athlete")

    frames = (
        db.query(PoseFrame)
        .filter(PoseFrame.video_id == video_id)
        .order_by(PoseFrame.frame_number)
        .all()
    )
    if not frames:
        raise HTTPException(status_code=404, detail="No pose data found for this video yet")
    return frames


@router.get(
    "/athlete/{athlete_id}/videos/{video_id}/biomechanics", response_model=BiomechanicsReportOut
)
def get_athlete_video_report(
    athlete_id: int,
    video_id: int,
    db: Session = Depends(get_db),
    user_and_role=Depends(get_current_user_and_role),
):
    user_id, role = user_and_role
    _require_staff_or_admin(role)
    _verify_access(db, user_id, role, athlete_id)

    video = db.query(Video).filter(Video.id == video_id, Video.athlete_id == athlete_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found for this athlete")

    report = db.query(BiomechanicsReport).filter(BiomechanicsReport.video_id == video_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not generated yet")
    return report


@router.get(
    "/athlete/{athlete_id}/videos/{video_id}/risk-assessment", response_model=InjuryRiskAssessmentOut
)
def get_athlete_video_risk_assessment(
    athlete_id: int,
    video_id: int,
    db: Session = Depends(get_db),
    user_and_role=Depends(get_current_user_and_role),
):
    user_id, role = user_and_role
    _require_staff_or_admin(role)
    _verify_access(db, user_id, role, athlete_id)

    video = db.query(Video).filter(Video.id == video_id, Video.athlete_id == athlete_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found for this athlete")

    assessment = (
        db.query(InjuryRiskAssessment).filter(InjuryRiskAssessment.video_id == video_id).first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Risk assessment not generated yet")
    return assessment
