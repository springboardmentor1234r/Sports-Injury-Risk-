from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.postgres import get_db
from app.db.mongo import get_mongo_db
from app.models.sql_models import User, UserRole, AthleteProfile, PhysicalAssessmentRecord
from app.core.rbac import require_roles

router = APIRouter(prefix="/coach", tags=["Coach Dashboard & Roster Management"])

@router.get("/roster", response_model=List[dict], status_code=status.HTTP_200_OK)
def get_coach_roster(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.COACH]))
):
    """
    Retrieve real athletes enrolled in the authenticated coach's team/roster.
    Returns an empty list [] if no athletes are registered or assigned to this coach.
    Does NOT return static mock fallback data.
    """
    # Fetch profiles assigned to this coach, or registered athletes if linked
    profiles = db.query(AthleteProfile).filter(AthleteProfile.coach_id == current_user.user_id).all()

    # If no athletes linked specifically, check if any profiles exist in DB for this coach's team
    # (If coach has zero enrolled athletes, profiles will be empty list [])
    roster_list = []
    
    for prof in profiles:
        athlete_user = db.query(User).filter(User.user_id == prof.user_id).first()
        if not athlete_user:
            continue
            
        # Get latest assessment for metrics
        latest_assessment = db.query(PhysicalAssessmentRecord).filter(
            PhysicalAssessmentRecord.user_id == athlete_user.user_id
        ).order_by(PhysicalAssessmentRecord.assessment_date.desc()).first()

        risk_score = 25 # Default baseline for real user
        alert_msg = None
        status_label = "Low Risk"

        if latest_assessment and latest_assessment.metrics_summary:
            summary = latest_assessment.metrics_summary
            if "risk_score" in summary:
                try:
                    risk_score = int(summary["risk_score"])
                except ValueError:
                    pass

        if prof.training_load > 1.5:
            alert_msg = f"ACWR Spike > 1.5 ({prof.training_load:.2f})"
            status_label = "High Risk"
            risk_score = max(risk_score, 75)
        elif risk_score >= 70:
            status_label = "High Risk"
            alert_msg = "High Biomechanical Injury Alert"
        elif risk_score >= 50:
            status_label = "Moderate Risk"
            alert_msg = "Moderate Fatigue Warning"

        roster_list.append({
            "id": athlete_user.user_id,
            "athlete_id": prof.athlete_id,
            "name": athlete_user.full_name or athlete_user.email,
            "email": athlete_user.email,
            "position": prof.position or "Athlete",
            "sport_type": prof.sport_type,
            "load": round(prof.training_load, 2),
            "riskScore": risk_score,
            "status": status_label,
            "alert": alert_msg
        })

    return roster_list

@router.get("/available-athletes", response_model=List[dict], status_code=status.HTTP_200_OK)
def get_available_athletes_for_coach(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.COACH]))
):
    """List registered athletes available to be enrolled into coach roster."""
    all_athlete_users = db.query(User).filter(User.role == UserRole.ATHLETE).all()
    available = []
    for user in all_athlete_users:
        prof = db.query(AthleteProfile).filter(AthleteProfile.user_id == user.user_id).first()
        available.append({
            "id": user.user_id,
            "name": user.full_name or user.email,
            "email": user.email,
            "sport_type": prof.sport_type if prof else "N/A",
            "position": prof.position if prof else "N/A",
            "is_enrolled": bool(prof and prof.coach_id == current_user.user_id)
        })
    return available

@router.post("/enroll/{athlete_user_id}", status_code=status.HTTP_200_OK)
def enroll_athlete_to_coach(
    athlete_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.COACH]))
):
    """Enroll an existing registered athlete into authenticated coach's team."""
    prof = db.query(AthleteProfile).filter(AthleteProfile.user_id == athlete_user_id).first()
    if not prof:
        # Check if user exists and create a default profile if missing
        user = db.query(User).filter(User.user_id == athlete_user_id, User.role == UserRole.ATHLETE).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Athlete user not found")
        prof = AthleteProfile(
            user_id=user.user_id,
            athlete_id=f"ATH-{user.user_id:04d}",
            sport_type="General Athletics",
            position="Athlete",
            age=22,
            height=175.0,
            weight=70.0,
            training_load=1.2,
            coach_id=current_user.user_id
        )
        db.add(prof)
    else:
        prof.coach_id = current_user.user_id

    db.commit()
    db.refresh(prof)
    return {"status": "success", "message": f"Athlete ID {athlete_user_id} enrolled in coach roster."}

@router.delete("/enroll/{athlete_user_id}", status_code=status.HTTP_200_OK)
def unenroll_athlete_from_coach(
    athlete_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.COACH]))
):
    """Unenroll an athlete from coach's team."""
    prof = db.query(AthleteProfile).filter(
        AthleteProfile.user_id == athlete_user_id,
        AthleteProfile.coach_id == current_user.user_id
    ).first()
    if not prof:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Athlete not found in your roster")

    prof.coach_id = None
    db.commit()
    return {"status": "success", "message": f"Athlete ID {athlete_user_id} removed from roster."}
