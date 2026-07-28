from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from database import get_db
from models import Athlete
from schemas import AthleteCreate, AthleteResponse
from auth import decode_token

router = APIRouter(prefix="/athlete", tags=["Athlete Profile"])

def get_current_user(authorization: str = Header(...)):
    try:
        token = authorization.replace("Bearer ", "")
        payload = decode_token(token)
        return payload["user_id"]
    except:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

@router.post("/profile", response_model=AthleteResponse)
def create_profile(
    data: AthleteCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    # Check if profile already exists
    existing = db.query(Athlete).filter(Athlete.user_id == user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists. Use PUT to update.")
    
    profile = Athlete(user_id=user_id, **data.dict())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile

@router.get("/profile", response_model=AthleteResponse)
def get_profile(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    profile = db.query(Athlete).filter(Athlete.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.put("/profile", response_model=AthleteResponse)
def update_profile(
    data: AthleteCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    profile = db.query(Athlete).filter(Athlete.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    for key, value in data.dict().items():
        setattr(profile, key, value)
    
    db.commit()
    db.refresh(profile)
    return profile