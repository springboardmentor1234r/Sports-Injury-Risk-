import os
import sys
from fastapi import APIRouter, Depends, status, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend")))

from app.database import get_db
from app.routers.auth import get_current_user
from schemas.risk_score import RiskScoresOut
from services.pipeline import get_or_compute_milestone3_results, verify_session_permission

router = APIRouter(prefix="/milestone3/risk-score", tags=["Milestone 3 - Risk Score"])

@router.get("/{session_id}", response_model=RiskScoresOut)
async def get_session_risk_score(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Fetch the calculated weighted risk scores and audit details for a session.
    """
    # 1. Verify permissions
    await verify_session_permission(session_id, current_user, db)

    # 2. Get or compute results
    pipeline_res = await get_or_compute_milestone3_results(session_id, db)
    score_doc = pipeline_res.get("risk_score")
    if not score_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Risk score results not available."
        )
    return score_doc
