import os
import sys
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timezone

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend")))

from app.database import get_db
from app.routers.auth import get_current_user
from schemas.pipeline import PipelineStatus, PipelineResult, PipelineError
from services.pipeline import get_or_compute_milestone3_results, verify_session_permission
from services.pipeline_trigger import trigger_milestone3_pipeline

router = APIRouter(prefix="/milestone3/pipeline", tags=["Milestone 3 - Ingestion Pipeline"])

@router.post("/{session_id}/run", response_model=PipelineStatus)
async def run_pipeline(
    session_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Launch the Milestone 3 anomaly, prediction, and recommendation processing pipeline in the background.
    """
    # 1. Verify permissions
    await verify_session_permission(session_id, current_user, db)

    # 2. Check current status
    status_doc = await db["Milestone3PipelineStatus"].find_one({"session_id": session_id})
    if status_doc:
        # If already running or completed, return immediately
        if status_doc.get("status") in ["PROCESSING", "COMPLETED"]:
            return status_doc

    # 3. Trigger background worker
    status_res = await trigger_milestone3_pipeline(session_id, db, background_tasks)
    return status_res


@router.get("/{session_id}/status", response_model=PipelineStatus)
async def get_status(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get the current execution status (PENDING, PROCESSING, COMPLETED, FAILED) of the pipeline.
    """
    # 1. Verify permissions
    await verify_session_permission(session_id, current_user, db)

    # 2. Fetch status
    status_doc = await db["Milestone3PipelineStatus"].find_one({"session_id": session_id})
    if not status_doc:
        # Check if session exists at all (implies idle / not run yet)
        session_doc = await db["AnalysisSessions"].find_one({"_id": ObjectId(session_id)})
        if not session_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis session not found."
            )
            
        return {
            "session_id": session_id,
            "status": "PENDING",
            "stage": "idle",
            "progress": 0,
            "message": "Pipeline has not been run for this session.",
            "error": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
    return status_doc


@router.get("/{session_id}/results")
async def get_results(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Fetch all calculated Milestone 3 outcomes alongside execution status logs.
    """
    # 1. Verify permissions
    await verify_session_permission(session_id, current_user, db)

    # 2. Fetch pipeline status
    status_doc = await db["Milestone3PipelineStatus"].find_one({"session_id": session_id})
    pipeline_status = status_doc.get("status") if status_doc else "PENDING"

    # 3. Load results
    results = await get_or_compute_milestone3_results(session_id, db)
    
    return {
        "anomalies": results.get("anomalies", []),
        "injury_predictions": results.get("injury_risks", []),
        "risk_score": results.get("risk_score"),
        "recommendations": results.get("recommendations", []),
        "pipeline_status": pipeline_status
    }
