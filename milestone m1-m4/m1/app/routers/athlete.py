from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import schemas, crud, auth, models
from app.database import get_db

router = APIRouter(prefix="/api/athletes", tags=["Athletes"])

@router.get("/profile", response_model=schemas.FullAthleteProfile)
def get_my_athlete_profile(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "athlete":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current logged in user is not an athlete. Profile only exists for athletes."
        )
    
    athlete = crud.get_athlete_by_user_id(db, user_id=current_user.id)
    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete profile not found"
        )
        
    return crud.get_athlete_full_profile(db, athlete_id=athlete.id)

@router.get("/profile/{athlete_id}", response_model=schemas.FullAthleteProfile)
def get_specific_athlete_profile(
    athlete_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Allow read access to self (if match), or coaches, physios, and admins
    athlete = db.query(models.Athlete).filter(models.Athlete.id == athlete_id).first()
    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete profile not found"
        )
        
    if current_user.role == "athlete":
        # Can only view their own profile
        own_profile = crud.get_athlete_by_user_id(db, user_id=current_user.id)
        if not own_profile or own_profile.id != athlete_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Athletes can only access their own profiles."
            )
            
    # If they are coach, physio, or admin, let them proceed
    return crud.get_athlete_full_profile(db, athlete_id=athlete_id)

@router.put("/profile", response_model=schemas.AthleteResponse)
def update_my_athlete_profile(
    profile_update: schemas.AthleteUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "athlete":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current logged in user is not an athlete."
        )
        
    athlete = crud.get_athlete_by_user_id(db, user_id=current_user.id)
    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete profile not found"
        )
        
    updated = crud.update_athlete_profile(db, athlete_id=athlete.id, profile_update=profile_update)
    return updated

@router.get("", response_model=List[schemas.AthleteResponse])
def list_all_athletes(
    current_user: models.User = Depends(auth.RoleChecker(["coach", "physiotherapist", "admin"])),
    db: Session = Depends(get_db)
):
    # Retrieve lists of athletes for coaches/therapists
    return db.query(models.Athlete).all()
