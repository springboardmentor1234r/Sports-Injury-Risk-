import os
import sys
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend")))

from app.database import get_db
from app.routers.auth import get_current_user
from schemas.anomaly import MovementAnomaliesOut
from services.pipeline import get_or_compute_milestone3_results, verify_session_permission

router = APIRouter(prefix="/milestone3/anomalies", tags=["Milestone 3 - Movement Anomalies"])

@router.get("/{session_id}", response_model=List[MovementAnomaliesOut])
async def get_session_anomalies(
    session_id: str,
    severity: Optional[str] = Query(None, description="Filter by severity: Low, Moderate, High, Critical"),
    anomaly_type: Optional[str] = Query(None, description="Filter by anomaly type"),
    affected_joint: Optional[str] = Query(None, description="Filter by affected joint"),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Fetch movement technique anomalies identified for a session.
    """
    # 1. Verify permissions
    await verify_session_permission(session_id, current_user, db)

    # 2. Get or compute results
    pipeline_res = await get_or_compute_milestone3_results(session_id, db)
    anomalies = pipeline_res.get("anomalies", [])

    # 3. Apply filters
    filtered = []
    for a in anomalies:
        if severity and a.get("severity", "").lower() != severity.lower():
            continue
        if anomaly_type and a.get("anomaly_type", "").lower() != anomaly_type.lower():
            continue
        if affected_joint and affected_joint.lower() not in a.get("affected_joint", "").lower():
            continue
        filtered.append(a)

    return filtered
