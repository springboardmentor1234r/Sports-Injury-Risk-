from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import auth, crud, models, schemas
from app.database import get_db
from app.services.intelligence import AthleteIntelligenceService

router = APIRouter(prefix="/api/intelligence", tags=["Athlete Intelligence"])

def allow_athlete_access(athlete_id, user, db):
    athlete = db.query(models.Athlete).filter(models.Athlete.id == athlete_id).first()
    if not athlete: raise HTTPException(404, "Athlete profile not found")
    if user.role == "athlete" and athlete.user_id != user.id: raise HTTPException(403, "Athletes can only access their own intelligence data.")
    return athlete

@router.get("/athletes/{athlete_id}", response_model=schemas.IntelligenceAssessmentResponse)
def get_latest_assessment(athlete_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    allow_athlete_access(athlete_id, current_user, db)
    assessment = db.query(models.IntelligenceAssessment).filter(models.IntelligenceAssessment.athlete_id == athlete_id).order_by(models.IntelligenceAssessment.assessed_at.desc()).first()
    if not assessment: assessment = AthleteIntelligenceService.build_assessment(db, athlete_id, persist=True)
    return AthleteIntelligenceService.serialize(db, assessment)

@router.post("/athletes/{athlete_id}/assess", response_model=schemas.IntelligenceAssessmentResponse)
def create_assessment(athlete_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    allow_athlete_access(athlete_id, current_user, db)
    return AthleteIntelligenceService.serialize(db, AthleteIntelligenceService.build_assessment(db, athlete_id, persist=True))

@router.get("/executive", response_model=schemas.ExecutiveDashboardResponse)
def executive_dashboard(current_user: models.User = Depends(auth.RoleChecker(["coach", "physiotherapist", "sports_scientist", "admin"])), db: Session = Depends(get_db)):
    athletes = db.query(models.Athlete).all()
    latest = []
    for athlete in athletes:
        item = db.query(models.IntelligenceAssessment).filter(models.IntelligenceAssessment.athlete_id == athlete.id).order_by(models.IntelligenceAssessment.assessed_at.desc()).first()
        if item: latest.append((athlete, item))
    distribution = {level: sum(1 for _, x in latest if x.risk_category == level) for level in ("Low", "Moderate", "High", "Critical")}
    high = [{"athlete_id": a.id, "athlete_name": a.user.full_name, "risk_score": x.injury_risk_score, "risk_category": x.risk_category} for a, x in latest if x.risk_category in ("High", "Critical")]
    anomalies = db.query(models.MovementAnomaly).order_by(models.MovementAnomaly.detected_at.desc()).limit(10).all()
    recent = [{"athlete_id": a.id, "athlete_name": a.user.full_name, "assessed_at": x.assessed_at, "risk_score": x.injury_risk_score, "risk_category": x.risk_category} for a, x in sorted(latest, key=lambda pair: pair[1].assessed_at, reverse=True)[:10]]
    count = len(latest) or 1
    return {"total_athletes": len(athletes), "total_analyzed_videos": db.query(models.Video).filter(models.Video.status == "analyzed").count(), "risk_distribution": distribution, "high_risk_athletes": high, "recent_anomalies": anomalies, "recent_assessments": recent, "team_averages": {"risk_score": round(sum(x.injury_risk_score for _, x in latest)/count, 1), "movement_quality": round(sum(x.movement_quality_score for _, x in latest)/count, 1), "health_score": round(sum(x.health_score for _, x in latest)/count, 1)}}
