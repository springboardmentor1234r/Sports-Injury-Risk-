from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.dependencies.roles import require_roles

from app.schemas.athlete import AthleteCreate, AthleteResponse

from app.crud.athlete import (
    create_athlete,
    get_all_athletes,
    get_athlete_by_id,
    update_athlete,
    delete_athlete,
)

router = APIRouter(
    prefix="/athletes",
    tags=["Athletes"]
)


# Create Athlete
@router.post("/", response_model=AthleteResponse)
def add_athlete(
    athlete: AthleteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles([
            "administrator",
            "coach"
        ])
    ),
):
    return create_athlete(db, athlete)


# Get All Athletes
@router.get("/", response_model=list[AthleteResponse])
def read_athletes(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles([
            "administrator",
            "coach",
            "physiotherapist",
            "sports_scientist",
            "athlete"
        ])
    ),
):
    return get_all_athletes(db)


# Get Athlete by ID
@router.get("/{athlete_id}", response_model=AthleteResponse)
def read_athlete(
    athlete_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles([
            "administrator",
            "coach",
            "physiotherapist",
            "sports_scientist",
            "athlete"
        ])
    ),
):
    athlete = get_athlete_by_id(db, athlete_id)

    if athlete is None:
        raise HTTPException(
            status_code=404,
            detail="Athlete not found"
        )

    return athlete


# Update Athlete
@router.put("/{athlete_id}", response_model=AthleteResponse)
def edit_athlete(
    athlete_id: int,
    athlete: AthleteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles([
            "administrator",
            "coach",
            "physiotherapist"
        ])
    ),
):
    updated = update_athlete(db, athlete_id, athlete)

    if updated is None:
        raise HTTPException(
            status_code=404,
            detail="Athlete not found"
        )

    return updated


# Delete Athlete
@router.delete("/{athlete_id}")
def remove_athlete(
    athlete_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles([
            "administrator"
        ])
    ),
):
    deleted = delete_athlete(db, athlete_id)

    if deleted is None:
        raise HTTPException(
            status_code=404,
            detail="Athlete not found"
        )

    return {
        "message": "Athlete deleted successfully"
    }