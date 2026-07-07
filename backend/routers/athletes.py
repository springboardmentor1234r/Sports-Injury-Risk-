from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Athlete, User, UserRole
from schemas import AthleteCreate, AthleteUpdate, AthleteOut
from dependencies import get_current_user

router = APIRouter(prefix="/athletes", tags=["athletes"])


@router.post("/me", response_model=AthleteOut)
def create_my_profile(
    data: AthleteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.athlete:
        raise HTTPException(status_code=403, detail="Only athletes can create an athlete profile")

    existing = db.query(Athlete).filter(Athlete.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists, use PUT to update")

    profile = Athlete(user_id=current_user.id, **data.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/me", response_model=AthleteOut)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(Athlete).filter(Athlete.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found, create one first")
    return profile


@router.put("/me", response_model=AthleteOut)
def update_my_profile(
    data: AthleteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(Athlete).filter(Athlete.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found, create one first")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile


@router.get("/{athlete_id}", response_model=AthleteOut)
def get_athlete_by_id(
    athlete_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Coaches, physios, sports scientists, admins can view any athlete profile.
    # Athletes can only view their own — already covered by /me above.
    if current_user.role == UserRole.athlete:
        raise HTTPException(status_code=403, detail="Athletes can only view their own profile via /athletes/me")

    profile = db.query(Athlete).filter(Athlete.id == athlete_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Athlete not found")
    return profile