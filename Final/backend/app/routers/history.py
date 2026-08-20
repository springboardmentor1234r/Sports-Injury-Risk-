import os
import sys
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend")))

from app.database import get_db
from app.routers.auth import get_current_user
from schemas.history import HistoryListResponse
from services.history_service import HistoryService
from routers.auth_helper import verify_athlete_permission

router = APIRouter(prefix="/milestone4/history", tags=["Milestone 4 - History"])

def normalize_datetime(dt: datetime) -> datetime:
    """Helper to convert aware datetimes to naive UTC for safe comparison."""
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt

@router.get("/{athlete_id}", response_model=HistoryListResponse)
async def get_history(
    athlete_id: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get chronological analysis summaries for an athlete with optional date filtering.
    """
    # 1. Verify access permissions
    await verify_athlete_permission(athlete_id, current_user, db)

    # 2. Retrieve history list
    history_records = await HistoryService.get_athlete_history(athlete_id, db)

    # 3. Apply optional date filters
    filtered_records = []
    for record in history_records:
        rec_date = record.get("analysis_date")
        if not rec_date:
            continue
        
        # Normalize comparison targets
        norm_rec_date = normalize_datetime(rec_date)
        
        if start_date:
            norm_start = normalize_datetime(start_date)
            if norm_rec_date < norm_start:
                continue
                
        if end_date:
            norm_end = normalize_datetime(end_date)
            # If end_date has no specific time component (midnight), extend to end of day
            if norm_end.hour == 0 and norm_end.minute == 0 and norm_end.second == 0 and norm_end.microsecond == 0:
                norm_end = norm_end.replace(hour=23, minute=59, second=59, microsecond=999999)
            if norm_rec_date > norm_end:
                continue
                
        filtered_records.append(record)

    return {
        "athlete_id": athlete_id,
        "history": filtered_records
    }
