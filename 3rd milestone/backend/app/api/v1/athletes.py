from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.athlete import AthleteCreate, AthleteResponse
from app.services.athlete_service import athlete_service
from app.core.auth import get_current_user
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=AthleteResponse)
async def create_athlete(
    athlete_in: AthleteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await athlete_service.create_athlete(db, athlete_in)

@router.get("/{athlete_id}", response_model=AthleteResponse)
async def get_athlete(
    athlete_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    athlete = await athlete_service.get_athlete(db, athlete_id)
    if not athlete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Athlete not found")
    return athlete
