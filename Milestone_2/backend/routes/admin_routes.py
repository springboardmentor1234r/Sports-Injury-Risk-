from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User, Athlete, AthleteAssignment
from schemas import UserOut, AthleteWithOwnerOut, AssignmentCreate, AssignmentOut
from auth import get_current_user_and_role

router = APIRouter(prefix="/admin", tags=["Admin"])


def _require_admin(role: str):
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin access only.")


@router.get("/users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), user_and_role=Depends(get_current_user_and_role)):
    _, role = user_and_role
    _require_admin(role)
    return db.query(User).order_by(User.name).all()


@router.get("/athletes", response_model=List[AthleteWithOwnerOut])
def list_athletes(db: Session = Depends(get_db), user_and_role=Depends(get_current_user_and_role)):
    _, role = user_and_role
    _require_admin(role)

    results = []
    for athlete in db.query(Athlete).all():
        owner = db.query(User).filter(User.id == athlete.user_id).first()
        if not owner:
            continue
        results.append(
            {
                "athlete_id": athlete.athlete_id,
                "user_id": athlete.user_id,
                "owner_name": owner.name,
                "owner_email": owner.email,
                "sport": athlete.sport,
                "position": athlete.position,
                "age": athlete.age,
                "height": athlete.height,
                "weight": athlete.weight,
                "injury_history": athlete.injury_history,
                "training_load": athlete.training_load,
            }
        )
    return results


@router.get("/assignments", response_model=List[AssignmentOut])
def list_assignments(db: Session = Depends(get_db), user_and_role=Depends(get_current_user_and_role)):
    _, role = user_and_role
    _require_admin(role)

    results = []
    for a in db.query(AthleteAssignment).order_by(AthleteAssignment.assigned_at.desc()).all():
        staff = db.query(User).filter(User.id == a.staff_user_id).first()
        athlete = db.query(Athlete).filter(Athlete.athlete_id == a.athlete_id).first()
        if not staff or not athlete:
            continue
        athlete_owner = db.query(User).filter(User.id == athlete.user_id).first()
        results.append(
            {
                "id": a.id,
                "staff_user_id": a.staff_user_id,
                "staff_name": staff.name,
                "staff_role": staff.role,
                "athlete_id": a.athlete_id,
                "athlete_name": athlete_owner.name if athlete_owner else "Unknown",
                "assigned_at": a.assigned_at,
            }
        )
    return results


@router.post("/assign", response_model=AssignmentOut)
def create_assignment(
    data: AssignmentCreate,
    db: Session = Depends(get_db),
    user_and_role=Depends(get_current_user_and_role),
):
    _, role = user_and_role
    _require_admin(role)

    staff = db.query(User).filter(User.id == data.staff_user_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff user not found")
    if staff.role not in ("coach", "physiotherapist", "sports_scientist"):
        raise HTTPException(
            status_code=400,
            detail="Selected user is not a coach, physiotherapist, or sports scientist.",
        )

    athlete = db.query(Athlete).filter(Athlete.athlete_id == data.athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    existing = (
        db.query(AthleteAssignment)
        .filter(
            AthleteAssignment.staff_user_id == data.staff_user_id,
            AthleteAssignment.athlete_id == data.athlete_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="This athlete is already assigned to this staff member.")

    assignment = AthleteAssignment(staff_user_id=data.staff_user_id, athlete_id=data.athlete_id)
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    athlete_owner = db.query(User).filter(User.id == athlete.user_id).first()
    return {
        "id": assignment.id,
        "staff_user_id": assignment.staff_user_id,
        "staff_name": staff.name,
        "staff_role": staff.role,
        "athlete_id": assignment.athlete_id,
        "athlete_name": athlete_owner.name if athlete_owner else "Unknown",
        "assigned_at": assignment.assigned_at,
    }


@router.delete("/assign/{assignment_id}")
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    user_and_role=Depends(get_current_user_and_role),
):
    _, role = user_and_role
    _require_admin(role)

    assignment = db.query(AthleteAssignment).filter(AthleteAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    db.delete(assignment)
    db.commit()
    return {"message": "Assignment removed"}
