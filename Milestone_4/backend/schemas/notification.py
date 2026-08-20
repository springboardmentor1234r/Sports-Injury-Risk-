from pydantic import BaseModel, Field
from datetime import datetime
from typing import List

class NotificationResponse(BaseModel):
    athlete_id: str
    session_id: str
    notification_type: str
    title: str
    message: str
    severity: str = Field(..., description="Low, Medium, High, Critical")
    read_status: bool
    created_at: datetime

    class Config:
        populate_by_name = True

class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    unread_count: int
