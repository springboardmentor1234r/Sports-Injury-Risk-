import os
import sys
from typing import List
from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend")))

from app.database import get_db
from app.routers.auth import get_current_user
from schemas.injury_risk import InjuryRiskPredictionsOut
from services.pipeline import get_or_compute_milestone3_results, verify_session_permission

router = APIRouter(prefix="/milestone3/injury-risk", tags=["Milestone 3 - Injury Risk"])

@router.get("/{session_id}", response_model=List[InjuryRiskPredictionsOut])
async def get_session_injury_risk(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Fetch injury category predictions (ACL, Hamstring, Ankle Sprain, Shoulder, Lower Back, Overuse) for a session.
    """
    # 1. Verify permissions
    await verify_session_permission(session_id, current_user, db)

    # 2. Get or compute results
    pipeline_res = await get_or_compute_milestone3_results(session_id, db)
    return pipeline_res.get("injury_risks", [])
