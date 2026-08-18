"""
Dependency injection container for FastAPI.

Provides service instances with database session injection.
"""
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.auth_service import AuthService
from app.services.athlete_service import AthleteService
from app.services.video_service import VideoService
from app.services.analysis_service import AnalysisService
from app.services.prediction_service import PredictionService
from app.services.recommendation_service import RecommendationService
from app.services.report_service import ReportService
from app.services.notification_service import NotificationService
from app.services.dashboard_service import DashboardService


async def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(db)

async def get_athlete_service(db: AsyncSession = Depends(get_db)) -> AthleteService:
    return AthleteService(db)

async def get_video_service(db: AsyncSession = Depends(get_db)) -> VideoService:
    return VideoService(db)

async def get_analysis_service(db: AsyncSession = Depends(get_db)) -> AnalysisService:
    return AnalysisService(db)

async def get_prediction_service(db: AsyncSession = Depends(get_db)) -> PredictionService:
    return PredictionService(db)

async def get_recommendation_service(db: AsyncSession = Depends(get_db)) -> RecommendationService:
    return RecommendationService(db)

async def get_report_service(db: AsyncSession = Depends(get_db)) -> ReportService:
    return ReportService(db)

async def get_notification_service(db: AsyncSession = Depends(get_db)) -> NotificationService:
    return NotificationService(db)

async def get_dashboard_service(db: AsyncSession = Depends(get_db)) -> DashboardService:
    return DashboardService(db)
