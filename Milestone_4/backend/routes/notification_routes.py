"""
Milestone 4 — Notification & Alert System (PDF section 11)
Location: backend/routes/notification_routes.py

Notifications are generated automatically by
services/notifications.generate_notifications_for_risk_assessment(),
called from video_routes.py right after each video's Milestone 3 risk
assessment finishes. This router just lets the owning athlete read/manage
their own feed.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Notification
from schemas import NotificationOut
from routes.athelete_routes import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications & Alerts"])


@router.get("/", response_model=List[NotificationOut])
def list_my_notifications(
    db: Session = Depends(get_db), user_id: int = Depends(get_current_user)
):
    return (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )


@router.get("/unread-count")
def get_unread_count(db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    count = (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read == "no")
        .count()
    )
    return {"unread_count": count}


@router.post("/{notification_id}/read", response_model=NotificationOut)
def mark_notification_read(
    notification_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user)
):
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user_id)
        .first()
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = "yes"
    db.commit()
    db.refresh(notification)
    return notification


@router.post("/read-all")
def mark_all_read(db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read == "no")
        .update({"is_read": "yes"})
    )
    db.commit()
    return {"message": "All notifications marked as read"}
