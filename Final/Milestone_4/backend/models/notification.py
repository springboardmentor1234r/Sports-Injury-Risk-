from pydantic import BaseModel, Field
from datetime import datetime

class NotificationsDB(BaseModel):
    athlete_id: str
    session_id: str
    notification_type: str
    title: str
    message: str
    severity: str = Field(..., description="Low, Medium, High, Critical")
    read_status: bool = False
    created_at: datetime

    class Config:
        populate_by_name = True
