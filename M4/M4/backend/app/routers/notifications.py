from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import auth, models, schemas
from ..database import get_db

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=list[schemas.NotificationOut])
def list_notifications(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Notification).filter(models.Notification.recipient_id == current_user.id).order_by(models.Notification.created_at.desc()).all()


@router.post("/{notification_id}/read", response_model=schemas.NotificationOut)
def mark_read(notification_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    notification = db.query(models.Notification).filter(models.Notification.id == notification_id, models.Notification.recipient_id == current_user.id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification
