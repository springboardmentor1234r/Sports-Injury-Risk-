"""
routers/reports.py
---------------------
Export endpoints -- the BRD's Reports & Export System module (PDF export,
Excel export). Read access mirrors the underlying data each report is
built from: the athlete themself, or any staff role.
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.permissions import require_profile_read_access
from app.services import reports

router = APIRouter(prefix="/athletes/{profile_id}/reports", tags=["Reports & Export"])


@router.get("/risk-assessment.pdf")
def export_risk_assessment_pdf(
    profile: models.AthleteProfile = Depends(require_profile_read_access),
    db: Session = Depends(get_db),
):
    assessment = (
        db.query(models.RiskAssessment)
        .filter(models.RiskAssessment.athlete_profile_id == profile.id)
        .order_by(models.RiskAssessment.computed_at.desc())
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="No risk assessment has been computed for this athlete yet")

    pdf_bytes = reports.generate_risk_assessment_pdf(
        athlete_name=profile.user.full_name,
        sport_type=profile.sport_type,
        assessment={
            "overall_score": assessment.overall_score,
            "risk_band": assessment.risk_band,
            "biomechanical_score": assessment.biomechanical_score,
            "asymmetry_score": assessment.asymmetry_score,
            "historical_injury_score": assessment.historical_injury_score,
            "training_load_score": assessment.training_load_score,
            "fatigue_score": assessment.fatigue_score,
            "breakdown": assessment.breakdown,
            "data_completeness_warnings": assessment.data_completeness_warnings,
            "computed_at": assessment.computed_at,
        },
    )
    filename = f"risk-assessment-{profile.user.full_name.replace(' ', '-')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/training-load.xlsx")
def export_training_load_excel(
    profile: models.AthleteProfile = Depends(require_profile_read_access),
    db: Session = Depends(get_db),
):
    entries = (
        db.query(models.TrainingLoadEntry)
        .filter(models.TrainingLoadEntry.athlete_profile_id == profile.id)
        .all()
    )
    excel_bytes = reports.generate_training_load_excel(
        athlete_name=profile.user.full_name,
        entries=[
            {
                "session_date": e.session_date,
                "session_type": e.session_type,
                "duration_minutes": e.duration_minutes,
                "intensity_rpe": e.intensity_rpe,
                "notes": e.notes,
            }
            for e in entries
        ],
    )
    filename = f"training-load-{profile.user.full_name.replace(' ', '-')}.xlsx"
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
