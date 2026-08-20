from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.postgres import get_db
from app.models.sql_models import User, UserRole, AthleteProfile, InjuryHistory, PhysicalAssessmentRecord
from app.schemas.athlete import (
    AthleteProfileCreate, AthleteProfileOut,
    InjuryHistoryCreate, InjuryHistoryOut,
    PhysicalAssessmentCreate, PhysicalAssessmentOut
)
from app.core.rbac import get_current_user, require_roles

router = APIRouter(prefix="/athletes", tags=["Athlete Profile & Biomechanics Management"])

@router.post("/profile", response_model=AthleteProfileOut, status_code=status.HTTP_201_CREATED)
def create_or_update_athlete_profile(
    profile_in: AthleteProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([
        UserRole.ATHLETE, UserRole.COACH, UserRole.PHYSIOTHERAPIST, UserRole.ADMINISTRATOR
    ]))
):
    """Create or update Athlete Profile during onboarding or management workflow."""
    existing_profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == current_user.user_id).first()
    
    if existing_profile:
        existing_profile.athlete_id = profile_in.athlete_id
        existing_profile.sport_type = profile_in.sport_type
        existing_profile.position = profile_in.position
        existing_profile.age = profile_in.age
        existing_profile.height = profile_in.height
        existing_profile.weight = profile_in.weight
        existing_profile.training_load = profile_in.training_load
        if profile_in.coach_id is not None:
            existing_profile.coach_id = profile_in.coach_id
        if profile_in.physio_id is not None:
            existing_profile.physio_id = profile_in.physio_id
        profile = existing_profile
    else:
        profile = AthleteProfile(
            user_id=current_user.user_id,
            athlete_id=profile_in.athlete_id,
            sport_type=profile_in.sport_type,
            position=profile_in.position,
            age=profile_in.age,
            height=profile_in.height,
            weight=profile_in.weight,
            training_load=profile_in.training_load,
            coach_id=profile_in.coach_id,
            physio_id=profile_in.physio_id
        )
        db.add(profile)
    
    # Process initial injury history items if provided
    if profile_in.injury_history:
        for inj in profile_in.injury_history:
            db_inj = InjuryHistory(
                user_id=current_user.user_id,
                injury_type=inj.injury_type,
                recovery_status=inj.recovery_status,
                date_of_injury=inj.date_of_injury
            )
            db.add(db_inj)

    db.commit()
    db.refresh(profile)
    return profile

@router.get("/dashboard-summary", response_model=dict)
def get_athlete_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ATHLETE, UserRole.PHYSIOTHERAPIST, UserRole.COACH, UserRole.ADMINISTRATOR]))
):
    """
    Retrieve real biomechanical risk metrics, uploaded video statuses, and assessment logs for authenticated Athlete.
    """
    from app.db.mongo import get_mongo_db

    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == current_user.user_id).first()
    injuries = db.query(InjuryHistory).filter(InjuryHistory.user_id == current_user.user_id).all()
    assessments = db.query(PhysicalAssessmentRecord).filter(PhysicalAssessmentRecord.user_id == current_user.user_id).all()

    # Query MongoDB for user's uploaded videos
    mongo = get_mongo_db()
    videos_col = mongo["video_metadata"]
    user_videos = list(videos_col.find({"user_email": current_user.email}))
    
    clean_videos = []
    for v in user_videos:
        v_copy = dict(v)
        if "_id" in v_copy:
            v_copy["_id"] = str(v_copy["_id"])
        clean_videos.append(v_copy)

    latest_assessment = assessments[-1] if assessments else None

    return {
        "user_id": current_user.user_id,
        "full_name": current_user.full_name or current_user.email,
        "email": current_user.email,
        "role": current_user.role.value if isinstance(current_user.role, UserRole) else str(current_user.role),
        "profile": profile,
        "injury_history": injuries,
        "assessments": assessments,
        "videos": clean_videos,
        "latest_metrics": latest_assessment.metrics_summary if latest_assessment else None
    }

@router.get("/me", response_model=dict)
def get_my_athlete_details(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch complete athlete profile, injury history, and physical assessment records for logged-in user."""
    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == current_user.user_id).first()
    injuries = db.query(InjuryHistory).filter(InjuryHistory.user_id == current_user.user_id).all()
    assessments = db.query(PhysicalAssessmentRecord).filter(PhysicalAssessmentRecord.user_id == current_user.user_id).all()
    
    return {
        "user_id": current_user.user_id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value if isinstance(current_user.role, UserRole) else str(current_user.role),
        "profile": profile,
        "injury_history": injuries,
        "assessments": assessments
    }

@router.post("/injury-history", response_model=InjuryHistoryOut)
def record_injury(
    inj_in: InjuryHistoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ATHLETE, UserRole.PHYSIOTHERAPIST, UserRole.ADMINISTRATOR]))
):
    """Add a new injury record to athlete history."""
    inj = InjuryHistory(
        user_id=current_user.user_id,
        injury_type=inj_in.injury_type,
        recovery_status=inj_in.recovery_status,
        date_of_injury=inj_in.date_of_injury
    )
    db.add(inj)
    db.commit()
    db.refresh(inj)
    return inj

@router.post("/assessment", response_model=PhysicalAssessmentOut)
def log_physical_assessment(
    assessment_in: PhysicalAssessmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SPORTS_SCIENTIST, UserRole.PHYSIOTHERAPIST, UserRole.ADMINISTRATOR]))
):
    """Log physical assessment record metrics summary (accessible to Sports Scientists, Physios, Admins)."""
    assessment = PhysicalAssessmentRecord(
        user_id=current_user.user_id,
        metrics_summary=assessment_in.metrics_summary
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment
