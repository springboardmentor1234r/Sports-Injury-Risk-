import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_roles
from app.database import get_db
from app.models import AthleteProfile, User, UserRole
from app.schemas import AthleteProfileCreate, AthleteProfileOut, AthleteProfileUpdate

router = APIRouter(prefix="/athletes", tags=["Athlete Profiles"])

STAFF_ROLES = [UserRole.COACH, UserRole.PHYSIOTHERAPIST, UserRole.SPORTS_SCIENTIST, UserRole.ADMIN]


@router.post("/me/profile", response_model=AthleteProfileOut, status_code=status.HTTP_201_CREATED)
def create_my_profile(
    profile_in: AthleteProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ATHLETE])),
):
    existing = db.query(AthleteProfile).filter(AthleteProfile.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Athlete profile already exists")

    profile = AthleteProfile(user_id=current_user.id, **profile_in.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/me/profile", response_model=AthleteProfileOut)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ATHLETE])),
):
    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Athlete profile not found")
    return profile


@router.put("/me/profile", response_model=AthleteProfileOut)
def update_my_profile(
    profile_in: AthleteProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ATHLETE])),
):
    profile = db.query(AthleteProfile).filter(AthleteProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Athlete profile not found")

    for field, value in profile_in.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile


@router.get("", response_model=list[AthleteProfileOut])
def list_all_athletes(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(STAFF_ROLES)),
):
    return db.query(AthleteProfile).all()


@router.get("/{athlete_id}", response_model=AthleteProfileOut)
def get_athlete_by_id(
    athlete_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(STAFF_ROLES)),
):
    profile = db.query(AthleteProfile).filter(AthleteProfile.id == athlete_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Athlete profile not found")
    return profile