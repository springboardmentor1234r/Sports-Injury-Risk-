"""
Dashboard service — aggregated dashboard data for each role.
"""
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.athlete import Athlete
from app.models.video import Video
from app.models.analysis import VideoAnalysis
from app.models.prediction import InjuryPrediction
from app.models.user import User
import logging

logger = logging.getLogger(__name__)


class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_athlete_dashboard(self, user_id: int) -> Dict[str, Any]:
        """Dashboard data for an athlete."""
        return {
            'total_videos': await self._count(Video, Video.athlete_id == user_id),
            'total_analyses': 0,
            'latest_risk_score': None,
            'risk_history': [],
            'upcoming_sessions': [],
            'recommendations': [],
        }

    async def get_coach_dashboard(self, user_id: int) -> Dict[str, Any]:
        """Dashboard data for a coach — team overview."""
        return {
            'total_athletes': await self._count(Athlete),
            'high_risk_athletes': 0,
            'recent_analyses': [],
            'team_risk_distribution': {'LOW': 0, 'MEDIUM': 0, 'HIGH': 0, 'CRITICAL': 0},
            'alerts': [],
        }

    async def get_admin_dashboard(self) -> Dict[str, Any]:
        """Dashboard data for admin — system overview."""
        return {
            'total_users': await self._count(User),
            'total_athletes': await self._count(Athlete),
            'total_videos': await self._count(Video),
            'total_analyses': await self._count(VideoAnalysis),
            'processing_queue': 0,
            'system_health': 'OK',
        }

    async def get_physio_dashboard(self, user_id: int) -> Dict[str, Any]:
        """Dashboard data for physiotherapist."""
        return {
            'assigned_athletes': 0,
            'active_rehab_plans': 0,
            'high_risk_patients': 0,
            'recent_assessments': [],
        }

    async def get_scientist_dashboard(self, user_id: int) -> Dict[str, Any]:
        """Dashboard data for sports scientist."""
        return {
            'total_analyses': await self._count(VideoAnalysis),
            'model_accuracy': 0.87,
            'biomechanics_insights': [],
            'research_data': [],
        }

    async def _count(self, model, *filters) -> int:
        query = select(func.count()).select_from(model)
        for f in filters:
            query = query.where(f)
        result = await self.db.execute(query)
        return result.scalar() or 0
