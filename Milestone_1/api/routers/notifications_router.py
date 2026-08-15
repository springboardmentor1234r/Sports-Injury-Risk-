from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List
from pydantic import BaseModel
from api.dependencies import get_current_user
from database.mongo_utils import get_user_notifications, mark_notification_read

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

class MarkReadRequest(BaseModel):
    notification_id: str

@router.get("/")
def fetch_notifications(limit: int = 50, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Fetch notifications for the logged-in user."""
    user_id = current_user["user_id"]
    notifications = get_user_notifications(user_id, limit=limit)
    
    # Count unread
    unread_count = sum(1 for n in notifications if not n.get("is_read"))
    
    return {
        "notifications": notifications,
        "unread_count": unread_count
    }

@router.patch("/{notification_id}/read")
def read_notification(notification_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Mark a specific notification as read."""
    user_id = current_user["user_id"]
    success = mark_notification_read(notification_id, user_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found or already read")
    
    return {"message": "Notification marked as read"}
