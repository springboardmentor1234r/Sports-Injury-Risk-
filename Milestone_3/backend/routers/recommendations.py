import os
import sys
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend")))

from app.database import get_db
from app.routers.auth import get_current_user
from schemas.recommendation import RecommendationsOut
from services.pipeline import get_or_compute_milestone3_results, verify_session_permission

router = APIRouter(prefix="/milestone3/recommendations", tags=["Milestone 3 - Recommendations"])

@router.get("/{session_id}", response_model=List[RecommendationsOut])
async def get_session_recommendations(
    session_id: str,
    priority: Optional[str] = Query(None, description="Filter by priority: Low, Medium, High, Critical"),
    recommendation_type: Optional[str] = Query(None, description="Filter by recommendation type"),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Fetch corrective recommendations generated for a session.
    """
    # 1. Verify permissions
    await verify_session_permission(session_id, current_user, db)

    # 2. Get or compute results
    pipeline_res = await get_or_compute_milestone3_results(session_id, db)
    recs = pipeline_res.get("recommendations", [])

    # 3. Apply filters
    filtered = []
    for r in recs:
        if priority and r.get("priority", "").lower() != priority.lower():
            continue
        if recommendation_type and r.get("recommendation_type", "").lower() != recommendation_type.lower():
            continue
        filtered.append(r)

    return filtered
