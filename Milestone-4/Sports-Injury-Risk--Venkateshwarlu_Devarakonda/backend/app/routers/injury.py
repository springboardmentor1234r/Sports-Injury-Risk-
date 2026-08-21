from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db

from app.models.user import User
from app.models.video import Video
from app.models.athlete_profile import AthleteProfile
from app.models.injury_report import InjuryReport

from app.schemas.injury_schema import (
    InjuryReportCreate,
    InjuryReportUpdate,
    InjuryReportResponse,
)

from app.utils.roles import require_role

router = APIRouter(
    prefix="/injury",
    tags=["Injury Reports"]
)


# ==========================================================
# Create Injury Report (Athlete)
# ==========================================================

@router.post(
    "/report",
    response_model=InjuryReportResponse
)
def create_report(
    report: InjuryReportCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("athlete"))
):

    user = db.query(User).filter(
        User.email == current_user["sub"]
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    athlete = db.query(AthleteProfile).filter(
        AthleteProfile.user_id == user.id
    ).first()

    if not athlete:
        raise HTTPException(
            status_code=404,
            detail="Athlete profile not found"
        )

    video = db.query(Video).filter(
        Video.id == report.video_id,
        Video.athlete_id == athlete.id
    ).first()

    if not video:
        raise HTTPException(
            status_code=404,
            detail="Video not found"
        )

    new_report = InjuryReport(
        athlete_id=athlete.id,
        video_id=report.video_id,
        injury_risk=report.injury_risk,
        risk_level=report.risk_level,
        body_part=report.body_part,
        recommendation=report.recommendation,
        movement_quality=report.movement_quality,
        balance_score=report.balance_score,
        symmetry_score=report.symmetry_score,
        range_of_motion=report.range_of_motion,
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return new_report


# ==========================================================
# Athlete Report History
# ==========================================================

@router.get(
    "/history",
    response_model=list[InjuryReportResponse]
)
def report_history(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("athlete"))
):

    user = db.query(User).filter(
        User.email == current_user["sub"]
    ).first()

    athlete = db.query(AthleteProfile).filter(
        AthleteProfile.user_id == user.id
    ).first()

    reports = (
        db.query(InjuryReport)
        .filter(InjuryReport.athlete_id == athlete.id)
        .order_by(InjuryReport.created_at.desc())
        .all()
    )

    return reports


# ==========================================================
# Get Single Report
# ==========================================================

@router.get(
    "/{report_id}",
    response_model=InjuryReportResponse
)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
    require_role(
        "athlete",
        "coach",
        "physiotherapist",
        "sports_scientist",
        "admin",
    )
)
):

    report = db.query(InjuryReport).filter(
        InjuryReport.id == report_id
    ).first()

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    return report


# ==========================================================
# Update Report
# ==========================================================

@router.put(
    "/{report_id}",
    response_model=InjuryReportResponse
)
def update_report(
    report_id: int,
    update: InjuryReportUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
    require_role(
        "coach",
        "physiotherapist",
        "sports_scientist",
        "admin",
    )
)
):

    report = db.query(InjuryReport).filter(
        InjuryReport.id == report_id
    ).first()

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    data = update.model_dump(exclude_unset=True)

    for key, value in data.items():
        setattr(report, key, value)

    db.commit()
    db.refresh(report)

    return report


# ==========================================================
# Delete Report
# ==========================================================

@router.delete(
    "/{report_id}"
)
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
    require_role("admin")
)
):

    report = db.query(InjuryReport).filter(
        InjuryReport.id == report_id
    ).first()

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    db.delete(report)
    db.commit()

    return {
        "message": "Report deleted successfully"
    }