"""
routers/analytics.py
-----------------------
Aggregate, roster-wide views -- the BRD's "Coach Dashboard" (team risk
overview) and "Sports Scientist Dashboard" (team performance trends) call
for this: a single-athlete view answers "how is this person doing," but a
coach or sports scientist also needs "who on my roster needs attention
right now," which requires looking across every athlete at once.

Read-only, staff-only (coach, physiotherapist, sports_scientist, admin) --
this is a roster-wide view of other people's data, which an athlete should
never see for anyone but themselves (that boundary is enforced on every
other endpoint in this app; there is no reason to relax it here).
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.auth import require_roles

router = APIRouter(prefix="/analytics", tags=["Analytics"])

STAFF_ROLES = (
    models.UserRole.coach,
    models.UserRole.physiotherapist,
    models.UserRole.sports_scientist,
    models.UserRole.admin,
)


@router.get("/team-overview", response_model=schemas.TeamOverview)
def get_team_overview(
    current_user: models.User = Depends(require_roles(*STAFF_ROLES)),
    db: Session = Depends(get_db),
):
    profiles = db.query(models.AthleteProfile).all()

    band_counts = {"low": 0, "moderate": 0, "high": 0, "critical": 0}
    athlete_rows = []

    for profile in profiles:
        latest = (
            db.query(models.RiskAssessment)
            .filter(models.RiskAssessment.athlete_profile_id == profile.id)
            .order_by(models.RiskAssessment.computed_at.desc())
            .first()
        )
        if latest:
            band_counts[latest.risk_band.value] += 1

        athlete_rows.append({
            "profile_id": profile.id,
            "full_name": profile.user.full_name,
            "sport_type": profile.sport_type,
            "latest_score": latest.overall_score if latest else None,
            "latest_band": latest.risk_band if latest else None,
            "computed_at": latest.computed_at if latest else None,
        })

    # Highest risk first -- the point of this view is "who needs attention",
    # so the most actionable rows should be at the top, not alphabetical.
    # Athletes with no assessment yet go last, not first (they're not
    # necessarily safe, they're just unmeasured -- shouldn't visually
    # compete with athletes with a known elevated score).
    athlete_rows.sort(key=lambda r: (r["latest_score"] is None, -(r["latest_score"] or 0)))

    return {
        "total_athletes": len(profiles),
        "assessed_athletes": sum(band_counts.values()),
        "band_counts": band_counts,
        "athletes": athlete_rows,
    }
