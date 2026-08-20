import os
import sys
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend")))

from app.database import get_db
from app.routers.auth import get_current_user
from schemas.notification import NotificationListResponse, NotificationResponse
from services.notification_service import NotificationService
from routers.auth_helper import verify_athlete_permission, verify_session_permission

router = APIRouter(prefix="/milestone4/notifications", tags=["Milestone 4 - Notifications"])

@router.get("/{athlete_id}", response_model=NotificationListResponse)
async def get_notifications(
    athlete_id: str,
    unread_only: bool = True,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Retrieve system alerts for an athlete, with optional unread-only filtering.
    """
    # 1. Verify access permissions
    await verify_athlete_permission(athlete_id, current_user, db)

    # 2. Fetch list
    notifications = await NotificationService.get_athlete_notifications(athlete_id, db, unread_only=unread_only)
    
    # Calculate unread count
    unread_cursor = db["Notifications"].find({"athlete_id": athlete_id, "read_status": False})
    unread_list = await unread_cursor.to_list(length=1000)

    return {
        "notifications": notifications,
        "unread_count": len(unread_list)
    }


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Mark a specific notification alert as read.
    """
    # 1. Fetch notification first to verify ownership
    try:
        notif_doc = await db["Notifications"].find_one({"_id": ObjectId(notification_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Notification ID format."
        )

    if not notif_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification alert not found."
        )

    # 2. Verify permissions
    athlete_id = notif_doc.get("athlete_id")
    await verify_athlete_permission(athlete_id, current_user, db)

    # 3. Update status
    success = await NotificationService.mark_notification_as_read(notification_id, db)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update notification status."
        )

    # Return updated document
    notif_doc["read_status"] = True
    notif_doc["_id"] = str(notif_doc["_id"])
    return notif_doc


@router.post("/{session_id}/evaluate", response_model=List[NotificationResponse])
async def evaluate_notifications(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Evaluate completed analysis risk parameters and dispatch appropriate notifications.
    """
    # 1. Verify session permissions
    session_doc = await verify_session_permission(session_id, current_user, db)
    athlete_id = str(session_doc.get("athlete_id"))

    # 2. Generate notifications
    try:
        alerts = await NotificationService.generate_notifications(athlete_id, session_id, db)
        return alerts
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
