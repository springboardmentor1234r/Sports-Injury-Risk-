from pydantic import BaseModel
from datetime import datetime


class VideoResponse(BaseModel):
    id: int
    athlete_id: int
    filename: str
    filepath: str
    uploaded_at: datetime

    class Config:
        from_attributes = True