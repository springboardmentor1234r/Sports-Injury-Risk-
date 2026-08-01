from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.models.video import VideoStatus

class VideoBase(BaseModel):
    athlete_id: int
    file_path: str
    s3_key: Optional[str] = None
    format: Optional[str] = None
    duration: Optional[float] = None
    fps: Optional[float] = None
    resolution: Optional[str] = None

class VideoCreate(VideoBase):
    pass

class VideoUpdate(BaseModel):
    status: Optional[VideoStatus] = None
    metadata_info: Optional[Dict[str, Any]] = None

class VideoInDBBase(VideoBase):
    id: int
    status: VideoStatus
    metadata_info: Dict[str, Any]

    class Config:
        from_attributes = True

class VideoResponse(VideoInDBBase):
    pass
