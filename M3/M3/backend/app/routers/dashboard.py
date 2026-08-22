from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from .. import auth, models, schemas
from ..database import get_db

router = APIRouter(prefix="/dashboard", tags=["Role Dashboards"])


def brief(analysis: models.VideoAnalysis) -> dict:
    result = analysis.result
    return {
        "id": analysis.id, "athlete": analysis.athlete.user.full_name,
        "activity": analysis.activity, "created_at": analysis.created_at,
        "risk": result.overall_risk if result else None,
        "risk_level": result.risk_level if result else "pending",
        "movement_quality": result.movement_quality_score if result else None,
        "finding": result.findings[0] if result and result.findings else "Processing assessment",
    }


def latest_for(profile: models.AthleteProfile):
    completed = [item for item in profile.analyses if item.result]
    return max(completed, key=lambda item: item.processed_at or item.created_at) if completed else None


@router.get("/overview", response_model=schemas.DashboardOut)
def overview(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    base = db.query(models.VideoAnalysis).options(joinedload(models.VideoAnalysis.result), joinedload(models.VideoAnalysis.athlete).joinedload(models.AthleteProfile.user)).order_by(models.VideoAnalysis.created_at.desc())
    unread = db.query(models.Notification).filter(models.Notification.recipient_id == current_user.id, models.Notification.is_read.is_(False)).count()

    if current_user.role == models.RoleEnum.athlete:
        profile = db.query(models.AthleteProfile).options(joinedload(models.AthleteProfile.analyses).joinedload(models.VideoAnalysis.result)).filter(models.AthleteProfile.user_id == current_user.id).first()
        recent = base.join(models.AthleteProfile).filter(models.AthleteProfile.user_id == current_user.id).limit(5).all()
        latest = latest_for(profile) if profile else None
        data = {
            "headline": "Your movement intelligence, in one place.", "unread_notifications": unread,
            "profile_complete": bool(profile and profile.sport_type and profile.training_load),
            "risk": latest.result.overall_risk if latest and latest.result else None,
            "risk_level": latest.result.risk_level if latest and latest.result else "unassessed",
            "movement_quality": latest.result.movement_quality_score if latest and latest.result else None,
            "recommendations": latest.result.recommendations if latest and latest.result else [],
            "recent_analyses": [brief(item) for item in recent],
            "trend": [item.result.overall_risk for item in reversed(recent) if item.result],
        }
    elif current_user.role == models.RoleEnum.coach:
        athletes = db.query(models.AthleteProfile).options(joinedload(models.AthleteProfile.analyses).joinedload(models.VideoAnalysis.result), joinedload(models.AthleteProfile.user)).all()
        latest = [latest_for(profile) for profile in athletes]
        data = {
            "headline": "Prioritize the team members who need your attention.", "unread_notifications": unread,
            "active_athletes": len(athletes), "videos_analyzed": base.filter(models.VideoAnalysis.status == models.AnalysisStatus.completed).count(),
            "high_risk_count": sum(1 for item in latest if item and item.result and item.result.risk_level in {"high", "critical"}),
            "team_readiness": round(sum(item.result.movement_quality_score for item in latest if item and item.result) / max(sum(1 for item in latest if item and item.result), 1), 1),
            "recent_analyses": [brief(item) for item in base.limit(6).all()],
        }
    elif current_user.role == models.RoleEnum.physiotherapist:
        reviewed = base.filter(models.VideoAnalysis.status == models.AnalysisStatus.completed).all()
        high = [item for item in reviewed if item.result and item.result.risk_level in {"high", "critical"}]
        data = {
            "headline": "A focused clinical view of movement risks and recovery needs.", "unread_notifications": unread,
            "review_queue": [brief(item) for item in high[:8]], "priority_cases": len(high),
            "assessments_today": sum(1 for item in reviewed if item.created_at.date() == datetime.utcnow().date()),
            "average_symmetry": round(sum(item.result.symmetry_score for item in reviewed if item.result) / max(len(reviewed), 1), 1),
            "recent_analyses": [brief(item) for item in reviewed[:6]],
        }
    elif current_user.role == models.RoleEnum.sports_scientist:
        completed = base.filter(models.VideoAnalysis.status == models.AnalysisStatus.completed).all()
        results = [item.result for item in completed if item.result]
        data = {
            "headline": "Explore biomechanics, load indicators, and longitudinal risk signals.", "unread_notifications": unread,
            "observations": len(results), "mean_risk": round(sum(item.overall_risk for item in results) / max(len(results), 1), 1),
            "mean_quality": round(sum(item.movement_quality_score for item in results) / max(len(results), 1), 1),
            "mean_symmetry": round(sum(item.symmetry_score for item in results) / max(len(results), 1), 1),
            "risk_distribution": {level: sum(1 for item in results if item.risk_level == level) for level in ("low", "moderate", "high", "critical")},
            "recent_analyses": [brief(item) for item in completed[:6]],
        }
    else:
        users = db.query(models.User).all()
        completed = base.filter(models.VideoAnalysis.status == models.AnalysisStatus.completed).all()
        data = {
            "headline": "Operational health, usage, and platform oversight.", "unread_notifications": unread,
            "total_users": len(users), "active_athletes": sum(1 for user in users if user.role == models.RoleEnum.athlete),
            "completed_analyses": len(completed), "platform_health": "Operational",
            "role_distribution": {role.value: sum(1 for user in users if user.role == role) for role in models.RoleEnum},
            "recent_analyses": [brief(item) for item in completed[:6]],
        }
    return {"role": current_user.role, "generated_at": datetime.utcnow(), "data": data}
