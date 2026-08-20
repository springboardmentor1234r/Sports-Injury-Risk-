import os
import sys
from fastapi import BackgroundTasks
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))
from services.pipeline import run_pipeline_stages

async def trigger_milestone3_pipeline(
    session_id: str,
    db: AsyncIOMotorDatabase,
    background_tasks: BackgroundTasks
) -> dict:
    """
    Asynchronously schedules/triggers the Milestone 3 anomaly & prediction calculations.
    """
    status_doc = await db["Milestone3PipelineStatus"].find_one({"session_id": session_id})
    if status_doc and status_doc.get("status") in ["PROCESSING", "COMPLETED"]:
        return status_doc

    # Update state to PENDING and queue background task
    new_status = {
        "session_id": session_id,
        "status": "PENDING",
        "stage": "queued",
        "progress": 0,
        "message": "Enqueuing Milestone 3 analysis stages.",
        "error": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db["Milestone3PipelineStatus"].update_one(
        {"session_id": session_id},
        {"$set": new_status},
        upsert=True
    )

    background_tasks.add_task(run_pipeline_stages, session_id, db)
    return new_status
