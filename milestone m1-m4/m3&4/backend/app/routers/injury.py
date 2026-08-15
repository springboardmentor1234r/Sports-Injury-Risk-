from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app import schemas, crud, auth, models
from app.database import get_db

router = APIRouter(prefix="/api/injuries", tags=["Injuries"])

@router.post("", response_model=schemas.InjuryHistoryResponse, status_code=status.HTTP_201_CREATED)
def log_injury(
    injury: schemas.InjuryHistoryCreate,
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
        # Staff role logging an injury
        if not athlete_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="athlete_id query parameter is required for staff members."
            )
        athlete_profile = db.query(models.Athlete).filter(models.Athlete.id == athlete_id).first()
        if not athlete_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Athlete with id {athlete_id} not found"
            )
        target_athlete_id = athlete_id
        
    return crud.create_injury_log(db=db, athlete_id=target_athlete_id, injury=injury)

@router.get("", response_model=List[schemas.InjuryHistoryResponse])
def get_injuries(
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
        # Staff users
        if not athlete_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="athlete_id is required to fetch logs when logged in as staff."
            )
        target_athlete_id = athlete_id
        
    return crud.get_athlete_injuries(db=db, athlete_id=target_athlete_id)
