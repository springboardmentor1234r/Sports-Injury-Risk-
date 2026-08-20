from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List, Dict

class LandmarkOut(BaseModel):
    name: str
    x: float
    y: float
    z: float
    visibility: float

class FramePoseOut(BaseModel):
    frame_number: int
    timestamp: float
    landmarks: List[LandmarkOut]
    average_confidence: float

class PoseAnalysisOut(BaseModel):
    id: str = Field(..., alias="_id")
    video_id: str
    session_id: str
    frames: List[FramePoseOut]
    processing_status: str
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}

class PoseAnalysisStatusResponse(BaseModel):
    id: str
    video_id: str
    session_id: str
    processing_status: str
    error_message: Optional[str] = None
    frames_processed: int
    total_frames: int
