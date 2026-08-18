from pydantic import BaseModel
from typing import Optional

class NotificationBase(BaseModel):
    user_id: int
    type: str
    message: str

class NotificationCreate(NotificationBase):
    pass

class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None

class NotificationInDBBase(NotificationBase):
    id: int
    is_read: bool

    class Config:
        from_attributes = True

class NotificationResponse(NotificationInDBBase):
    pass
