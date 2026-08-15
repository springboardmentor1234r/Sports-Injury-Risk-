from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app import schemas, crud, auth, models
from app.database import get_db

router = APIRouter(prefix="/api/training", tags=["Training Load"])

@router.post("", response_model=schemas.TrainingLoadResponse, status_code=status.HTTP_201_CREATED)
def log_training(
    training: schemas.TrainingLoadCreate,
    athlete_id: Optional[int] = Query(None, description="Target Athlete ID (Staff only)"),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    target_athlete_id = None
    
    if current_user.role == "athlete":
        athlete_profile = crud.get_athlete_by_user_id(db, user_id=current_user.id)
        if not athlete_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Athlete profile not found"
            )
        target_athlete_id = athlete_profile.id
    else:
        # Coach/Physio/Admin role logging on behalf of athlete
        if not athlete_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="athlete_id is required for staff logs."
            )
        athlete_profile = db.query(models.Athlete).filter(models.Athlete.id == athlete_id).first()
        if not athlete_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Athlete not found"
            )
        target_athlete_id = athlete_id
        
    return crud.create_training_log(db=db, athlete_id=target_athlete_id, training=training)

@router.get("", response_model=List[schemas.TrainingLoadResponse])
def get_training_logs(
    athlete_id: Optional[int] = Query(None, description="Filter by Athlete ID (Staff only)"),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    target_athlete_id = None
    
    if current_user.role == "athlete":
        athlete_profile = crud.get_athlete_by_user_id(db, user_id=current_user.id)
        if not athlete_profile:
            return []
        target_athlete_id = athlete_profile.id
    else:
        if not athlete_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="athlete_id is required to fetch training logs when logged in as staff."
            )
        target_athlete_id = athlete_id
        
    return crud.get_athlete_training_load(db=db, athlete_id=target_athlete_id)
