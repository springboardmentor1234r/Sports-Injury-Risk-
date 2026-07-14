from datetime import datetime
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.models.video import VideoStatus

class VideoCreate(BaseModel):
    athlete_id: str
    filename: str
    file_path: str
    activity_type: Optional[str] = None
    duration_seconds: Optional[float] = None
    fps: Optional[int] = None
    resolution: Optional[str] = None

class VideoResponse(BaseModel):
    id: str
    athlete_id: str
    filename: str
    file_path: str
    processed_file_path: Optional[str] = None
    status: VideoStatus
    activity_type: Optional[str] = None
    duration_seconds: Optional[float] = None
    fps: Optional[int] = None
    resolution: Optional[str] = None
    uploaded_at: datetime
    results: Dict[str, Any]

    class Config:
        from_attributes = True
