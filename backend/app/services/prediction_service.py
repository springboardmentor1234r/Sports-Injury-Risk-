"""
Prediction service — injury risk prediction business logic.
"""
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.prediction import InjuryPrediction
from app.repositories.base import BaseRepository
import logging

logger = logging.getLogger(__name__)


class PredictionService:
    """Handles injury risk prediction retrieval and explanation."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = BaseRepository(InjuryPrediction, db)

    async def get_prediction(self, prediction_id: int) -> Optional[InjuryPrediction]:
        return await self.repo.get(prediction_id)

    async def get_predictions_by_analysis(self, analysis_id: int) -> List[InjuryPrediction]:
        result = await self.db.execute(
            select(InjuryPrediction).where(InjuryPrediction.analysis_id == analysis_id)
        )
        return result.scalars().all()

    async def create_prediction(self, analysis_id: int, risk_score: float,
                               risk_level: str, body_region: str,
                               contributing_factors: dict = None,
                               shap_values: dict = None) -> InjuryPrediction:
        prediction = InjuryPrediction(
            analysis_id=analysis_id,
            risk_score=risk_score,
            risk_level=risk_level,
            body_region=body_region,
            contributing_factors=contributing_factors or {},
            shap_values=shap_values or {},
        )
        self.db.add(prediction)
        await self.db.commit()
        await self.db.refresh(prediction)
        logger.info(f"Created prediction {prediction.id}: {risk_level} ({risk_score})")
        return prediction

    async def get_explanation(self, prediction_id: int) -> Dict[str, Any]:
        """Get SHAP/LIME explanation for a prediction."""
        prediction = await self.repo.get(prediction_id)
        if not prediction:
            return {}
        return {
            'prediction_id': prediction.id,
            'risk_level': prediction.risk_level,
            'risk_score': float(prediction.risk_score),
            'shap_values': prediction.shap_values,
            'contributing_factors': prediction.contributing_factors,
        }
