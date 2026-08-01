"""
Recommendation service — exercise recommendations based on injury risk.
"""
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.recommendation import Recommendation
from app.repositories.base import BaseRepository


class RecommendationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = BaseRepository(Recommendation, db)

    async def get_by_prediction(self, prediction_id: int) -> List[Recommendation]:
        result = await self.db.execute(
            select(Recommendation).where(Recommendation.prediction_id == prediction_id)
        )
        return result.scalars().all()

    async def create_recommendations(self, prediction_id: int,
                                    recommendations: list) -> List[Recommendation]:
        created = []
        for rec in recommendations:
            obj = Recommendation(
                prediction_id=prediction_id,
                category=rec.get('category', 'General'),
                exercise_name=rec.get('exercise_name', ''),
                description=rec.get('description', ''),
                sets=rec.get('sets'),
                reps=rec.get('reps'),
                duration_minutes=rec.get('duration_minutes'),
                frequency=rec.get('frequency', 'Daily'),
                priority=rec.get('priority', 'Medium'),
            )
            self.db.add(obj)
            created.append(obj)
        await self.db.commit()
        return created
