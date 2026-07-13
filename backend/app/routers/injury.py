from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db

from app.models.user import User
from app.models.athlete_profile import AthleteProfile
from app.models.injury_report import InjuryReport

from app.schemas.injury_schema import (
    InjuryReportCreate,
    InjuryReportResponse
)

from app.utils.roles import require_role

router = APIRouter(
    prefix="/injury",
    tags=["Injury Reports"]
)
@router.post(
    "/report",
    response_model=InjuryReportResponse
)
def create_report(
    report: InjuryReportCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["athlete"]))
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

    new_report = InjuryReport(
        athlete_id=athlete.id,
        injury_risk=report.injury_risk,
        risk_level=report.risk_level,
        body_part=report.body_part,
        recommendation=report.recommendation
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return new_report