from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List

class VideoOut(BaseModel):
    id: str = Field(..., alias="_id")
    video_id: str
    athlete_id: str
    uploaded_by: str
    activity: str
    original_filename: str
    stored_filename: str
    file_size: int
    duration: float
    resolution: str
    fps: float
    upload_date: datetime
    status: str

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}

class VideoListResponse(BaseModel):
    videos: List[VideoOut]
    total: int
