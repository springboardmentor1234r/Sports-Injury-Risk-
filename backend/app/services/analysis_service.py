"""
Analysis service — business logic for video analysis pipeline.
"""
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.analysis import VideoAnalysis
from app.models.video import Video
from app.schemas.analysis import AnalysisCreate, AnalysisResponse
from app.repositories.base import BaseRepository
import logging

logger = logging.getLogger(__name__)


class AnalysisService:
    """Handles video analysis orchestration and result retrieval."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = BaseRepository(VideoAnalysis, db)

    async def start_analysis(self, video_id: int, model_version: str = "v1.0") -> VideoAnalysis:
        """Start analysis pipeline for a video. Triggers Celery task."""
        analysis = VideoAnalysis(
            video_id=video_id,
            status="PROCESSING",
            model_version=model_version,
        )
        self.db.add(analysis)
        await self.db.commit()
        await self.db.refresh(analysis)

        # Trigger async Celery task
        from app.tasks.analysis_tasks import run_analysis_pipeline
        run_analysis_pipeline.delay(analysis.id)

        logger.info(f"Started analysis {analysis.id} for video {video_id}")
        return analysis

    async def get_analysis(self, analysis_id: int) -> Optional[VideoAnalysis]:
        """Get analysis by ID."""
        return await self.repo.get(analysis_id)

    async def get_analyses_by_video(self, video_id: int) -> List[VideoAnalysis]:
        """Get all analyses for a video."""
        from sqlalchemy import select
        result = await self.db.execute(
            select(VideoAnalysis).where(VideoAnalysis.video_id == video_id)
        )
        return result.scalars().all()

    async def update_status(self, analysis_id: int, status: str,
                           error_message: str = None) -> Optional[VideoAnalysis]:
        """Update analysis status."""
        analysis = await self.repo.get(analysis_id)
        if analysis:
            analysis.status = status
            if error_message:
                analysis.error_message = error_message
            await self.db.commit()
        return analysis
