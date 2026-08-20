import os
import sys
from typing import List, Optional
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend")))

from app.database import get_db
from app.routers.auth import get_current_user
from schemas.anomaly import MovementAnomaliesOut
from schemas.injury_risk import InjuryRiskPredictionsOut
from schemas.risk_score import RiskScoresOut
from schemas.recommendation import RecommendationsOut
from services.pipeline import get_or_compute_milestone3_results, verify_session_permission

router = APIRouter(prefix="/milestone3/analysis", tags=["Milestone 3 - Combined Analysis"])

class CombinedAnalysisResponse(BaseModel):
    status: str
    anomalies: List[MovementAnomaliesOut]
    injury_risks: List[InjuryRiskPredictionsOut]
    risk_score: Optional[RiskScoresOut]
    recommendations: List[RecommendationsOut]

@router.get("/{session_id}", response_model=CombinedAnalysisResponse)
async def get_combined_analysis(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Fetch all Milestone 3 analysis metrics (anomalies, injury risks, risk scores, recommendations) in a single call.
    """
    # 1. Verify permissions
    await verify_session_permission(session_id, current_user, db)

    # 2. Get or compute results
    pipeline_res = await get_or_compute_milestone3_results(session_id, db)
    return pipeline_res
