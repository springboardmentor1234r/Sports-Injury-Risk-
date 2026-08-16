from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.postgres import get_db
from app.models.sql_models import User, UserRole, AthleteProfile, InjuryHistory, PhysicalAssessmentRecord
from app.core.rbac import require_roles

router = APIRouter(prefix="/physio", tags=["Physiotherapy Portal Management"])

@router.get("/patients", response_model=List[dict], status_code=status.HTTP_200_OK)
def get_physio_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.PHYSIOTHERAPIST]))
):
    """
    Retrieve assigned patient rehab cases for authenticated Physiotherapist.
    Returns empty list [] if no patients are enrolled/assigned.
    """
    profiles = db.query(AthleteProfile).filter(AthleteProfile.physio_id == current_user.user_id).all()
    patient_list = []

    for prof in profiles:
        user_rec = db.query(User).filter(User.user_id == prof.user_id).first()
        if not user_rec:
            continue

        injuries = db.query(InjuryHistory).filter(InjuryHistory.user_id == user_rec.user_id).all()
        latest_inj = injuries[-1] if injuries else None

        patient_list.append({
            "id": user_rec.user_id,
            "name": user_rec.full_name or user_rec.email,
            "email": user_rec.email,
            "sport": prof.sport_type,
            "injury": latest_inj.injury_type if latest_inj else "General Biomechanical Evaluation",
            "recovery_status": latest_inj.recovery_status if latest_inj else "Monitoring",
            "date_of_injury": latest_inj.date_of_injury if latest_inj else "N/A",
            "training_load": prof.training_load
        })

    return patient_list

@router.get("/available-athletes", response_model=List[dict], status_code=status.HTTP_200_OK)
def get_available_athletes_for_physio(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.PHYSIOTHERAPIST]))
):
    """List registered athletes available for physiotherapy assignment."""
    all_athlete_users = db.query(User).filter(User.role == UserRole.ATHLETE).all()
    available = []
    for user in all_athlete_users:
        prof = db.query(AthleteProfile).filter(AthleteProfile.user_id == user.user_id).first()
        available.append({
            "id": user.user_id,
            "name": user.full_name or user.email,
            "email": user.email,
            "sport_type": prof.sport_type if prof else "N/A",
            "is_assigned": bool(prof and prof.physio_id == current_user.user_id)
        })
    return available

@router.post("/assign/{athlete_user_id}", status_code=status.HTTP_200_OK)
def assign_patient_to_physio(
    athlete_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.PHYSIOTHERAPIST]))
):
    """Assign an existing registered athlete patient to authenticated physiotherapist."""
    prof = db.query(AthleteProfile).filter(AthleteProfile.user_id == athlete_user_id).first()
    if not prof:
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
            physio_id=current_user.user_id
        )
        db.add(prof)
    else:
        prof.physio_id = current_user.user_id

    db.commit()
    db.refresh(prof)
    return {"status": "success", "message": f"Athlete ID {athlete_user_id} assigned to physiotherapist care."}

@router.delete("/assign/{athlete_user_id}", status_code=status.HTTP_200_OK)
def unassign_patient_from_physio(
    athlete_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.PHYSIOTHERAPIST]))
):
    """Unassign patient from physiotherapist care."""
    prof = db.query(AthleteProfile).filter(
        AthleteProfile.user_id == athlete_user_id,
        AthleteProfile.physio_id == current_user.user_id
    ).first()
    if not prof:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found in your assigned list")

    prof.physio_id = None
    db.commit()
    return {"status": "success", "message": f"Athlete ID {athlete_user_id} unassigned from physiotherapist care."}
