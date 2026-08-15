from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app import models, auth, schemas
from app.database import get_db
from app.services.analytics import OvertrainingRiskAnalytics, BiomechanicalAnalytics

router = APIRouter(prefix="/api/admin", tags=["Admin Portal"])

@router.get("/stats", response_model=schemas.AdminDashboardStats)
def get_system_wide_stats(
    current_user: models.User = Depends(auth.RoleChecker(["admin", "coach"])),
    db: Session = Depends(get_db)
):
    """
    Retrieves global metrics summarizing active users, video processing queues, and critical alerts.
    Admin or Coach roles required.
    """
    total_users = db.query(models.User).count()
    total_athletes = db.query(models.Athlete).count()
    total_videos = db.query(models.Video).count()
    analyzed_videos = db.query(models.Video).filter(models.Video.status == "analyzed").count()
    
    # Calculate how many athletes are in a critical high risk threshold
    critical_alerts = 0
    athletes = db.query(models.Athlete).all()
    for athlete in athletes:
        # Check latest video biomechanics
        latest_video = db.query(models.Video)\
                        .filter(models.Video.athlete_id == athlete.id, models.Video.status == "analyzed")\
                        .order_by(models.Video.uploaded_at.desc()).first()
                        
        biomech = {"symmetry_index": 95.0, "posture_deviation_score": 5.0}
        if latest_video and latest_video.skeletal_data:
            biomech = BiomechanicalAnalytics.analyze_skeletal_data(latest_video.skeletal_data)
            
        prediction = OvertrainingRiskAnalytics.predict_injury_risk(db, athlete.id, biomech)
        if prediction["risk_level"] == "High":
            critical_alerts += 1

    return {
        "total_users": total_users,
        "total_athletes": total_athletes,
        "total_videos": total_videos,
        "analyzed_videos": analyzed_videos,
        "critical_injury_alerts": critical_alerts,
        "system_load_status": "Normal"
    }
