from sqlalchemy.ext.asyncio import AsyncSession
from app.models.athlete import Athlete
from app.repositories.base import BaseRepository

class AthleteRepository(BaseRepository[Athlete]):
    def __init__(self):
        super().__init__(Athlete)

athlete_repo = AthleteRepository()
