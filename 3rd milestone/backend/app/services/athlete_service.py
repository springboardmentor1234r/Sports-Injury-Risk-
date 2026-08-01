from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.athlete import AthleteCreate, AthleteUpdate
from app.repositories.athlete import athlete_repo
from app.models.athlete import Athlete

class AthleteService:
    async def create_athlete(self, db: AsyncSession, athlete_in: AthleteCreate) -> Athlete:
        return await athlete_repo.create(db, athlete_in)

    async def get_athlete(self, db: AsyncSession, athlete_id: int) -> Athlete:
        return await athlete_repo.get(db, athlete_id)

athlete_service = AthleteService()
