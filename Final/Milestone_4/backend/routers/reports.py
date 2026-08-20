import os
import sys
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend")))

from app.database import get_db
from app.routers.auth import get_current_user
from schemas.report import ReportResponse
from services.report_service import ReportService
from routers.auth_helper import verify_session_permission

router = APIRouter(prefix="/milestone4/reports", tags=["Milestone 4 - Reports"])

@router.post("/{session_id}/generate", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def generate_report(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Compile and cache a detailed athlete physical evaluation report using calculated metrics.
    """
    # 1. Verify access permissions
    session_doc = await verify_session_permission(session_id, current_user, db)
    athlete_id = str(session_doc.get("athlete_id"))

    # 2. Run generator
    try:
        report = await ReportService.generate_report(athlete_id, session_id, db)
        return report
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report compilation failed: {str(e)}"
        )


@router.get("/{session_id}", response_model=ReportResponse)
async def get_report(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Retrieve an existing compiled report for a session.
    """
    # 1. Verify access permissions
    await verify_session_permission(session_id, current_user, db)

    # 2. Retrieve report
    report = await db["AthleteReports"].find_one({"session_id": session_id})
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found for this session. Please generate it first."
        )

    report["_id"] = str(report["_id"])
    return report
