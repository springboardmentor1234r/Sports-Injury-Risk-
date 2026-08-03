"""
Milestone 4 — Reports & Export System (PDF section 12)
Location: backend/routes/report_routes.py

Athlete self-service:
  GET /reports/videos/{video_id}/pdf        — single-video report (PDF)
  GET /reports/athlete/me/pdf                — full performance report (PDF)
  GET /reports/athlete/me/excel               — full performance report (Excel)

Staff / admin (same access rules as staff_routes.py — admins see everyone,
other staff need an AthleteAssignment):
  GET /reports/staff/athlete/{athlete_id}/pdf
  GET /reports/staff/athlete/{athlete_id}/excel
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
from models import Athlete, User, Video, BiomechanicsReport, InjuryRiskAssessment
from auth import get_current_user_and_role
from routes.athelete_routes import get_current_user
from routes.video_routes import _get_own_athlete
from routes.staff_routes import _require_staff_or_admin, _verify_access
from services.reports import (
    generate_video_pdf_report,
    generate_athlete_pdf_report,
    generate_athlete_excel_report,
)

router = APIRouter(prefix="/reports", tags=["Reports & Export"])


def _biomech_to_dict(report: Optional[BiomechanicsReport]) -> Optional[dict]:
    if not report:
        return None
    return {
        "movement_quality_score": report.movement_quality_score,
        "avg_trunk_lean": report.avg_trunk_lean,
        "knee_valgus_asymmetry": report.knee_valgus_asymmetry,
        "movement_symmetry_score": report.movement_symmetry_score,
    }


def _risk_to_dict(assessment: Optional[InjuryRiskAssessment]) -> Optional[dict]:
    if not assessment:
        return None
    return {
        "risk_category": assessment.risk_category,
        "overall_injury_risk_score": assessment.overall_injury_risk_score,
        "overall_athlete_health_score": assessment.overall_athlete_health_score,
        "biomechanical_deviation_score": assessment.biomechanical_deviation_score,
        "historical_injury_score": assessment.historical_injury_score,
        "movement_asymmetry_score": assessment.movement_asymmetry_score,
        "training_load_score": assessment.training_load_score,
        "fatigue_score": assessment.fatigue_score,
        "injury_type_risks": assessment.injury_type_risks,
        "anomalies_detected": assessment.anomalies_detected,
        "fatigue_detected": assessment.fatigue_detected,
        "recommendations": assessment.recommendations,
    }


def _video_rows_for_athlete(db: Session, athlete_id: int) -> List[dict]:
    """Newest-first {video + risk assessment} rows for every analyzed
    video belonging to this athlete — feeds the athlete performance
    report (PDF + Excel)."""
    videos = (
        db.query(Video)
        .filter(Video.athlete_id == athlete_id, Video.status == "completed")
        .order_by(Video.uploaded_at.desc())
        .all()
    )
    rows = []
    for v in videos:
        assessment = (
            db.query(InjuryRiskAssessment).filter(InjuryRiskAssessment.video_id == v.id).first()
        )
        if not assessment:
            continue
        rows.append(
            {
                "uploaded_at": v.uploaded_at,
                "activity_type": v.activity_type,
                "overall_injury_risk_score": assessment.overall_injury_risk_score,
                "risk_category": assessment.risk_category,
                "biomechanical_deviation_score": assessment.biomechanical_deviation_score,
                "historical_injury_score": assessment.historical_injury_score,
                "movement_asymmetry_score": assessment.movement_asymmetry_score,
                "training_load_score": assessment.training_load_score,
                "fatigue_score": assessment.fatigue_score,
                "injury_type_risks": assessment.injury_type_risks,
            }
        )
    return rows


def _pdf_response(buffer, filename: str) -> StreamingResponse:
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _excel_response(buffer, filename: str) -> StreamingResponse:
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ---------------------------------------------------------------------------
# Athlete self-service
# ---------------------------------------------------------------------------

@router.get("/videos/{video_id}/pdf")
def download_video_report_pdf(
    video_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user)
):
    athlete = _get_own_athlete(db, user_id)
    video = db.query(Video).filter(Video.id == video_id, Video.athlete_id == athlete.athlete_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found for your athlete profile")

    owner = db.query(User).filter(User.id == user_id).first()
    report = db.query(BiomechanicsReport).filter(BiomechanicsReport.video_id == video_id).first()
    assessment = (
        db.query(InjuryRiskAssessment).filter(InjuryRiskAssessment.video_id == video_id).first()
    )

    buffer = generate_video_pdf_report(
        video, athlete, owner.name if owner else "Athlete", _biomech_to_dict(report), _risk_to_dict(assessment)
    )
    return _pdf_response(buffer, f"video_{video_id}_report.pdf")


@router.get("/athlete/me/pdf")
def download_my_athlete_report_pdf(
    db: Session = Depends(get_db), user_id: int = Depends(get_current_user)
):
    athlete = _get_own_athlete(db, user_id)
    owner = db.query(User).filter(User.id == user_id).first()
    rows = _video_rows_for_athlete(db, athlete.athlete_id)
    buffer = generate_athlete_pdf_report(athlete, owner.name if owner else "Athlete", rows)
    return _pdf_response(buffer, f"athlete_{athlete.athlete_id}_performance_report.pdf")


@router.get("/athlete/me/excel")
def download_my_athlete_report_excel(
    db: Session = Depends(get_db), user_id: int = Depends(get_current_user)
):
    athlete = _get_own_athlete(db, user_id)
    owner = db.query(User).filter(User.id == user_id).first()
    rows = _video_rows_for_athlete(db, athlete.athlete_id)
    buffer = generate_athlete_excel_report(athlete, owner.name if owner else "Athlete", rows)
    return _excel_response(buffer, f"athlete_{athlete.athlete_id}_performance_report.xlsx")


# ---------------------------------------------------------------------------
# Staff / admin
# ---------------------------------------------------------------------------

@router.get("/staff/athlete/{athlete_id}/pdf")
def download_staff_athlete_report_pdf(
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

    rows = _video_rows_for_athlete(db, athlete_id)
    buffer = generate_athlete_pdf_report(athlete, owner.name if owner else "Athlete", rows)
    return _pdf_response(buffer, f"athlete_{athlete_id}_performance_report.pdf")


@router.get("/staff/athlete/{athlete_id}/excel")
def download_staff_athlete_report_excel(
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

    rows = _video_rows_for_athlete(db, athlete_id)
    buffer = generate_athlete_excel_report(athlete, owner.name if owner else "Athlete", rows)
    return _excel_response(buffer, f"athlete_{athlete_id}_performance_report.xlsx")
