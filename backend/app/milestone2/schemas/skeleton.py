from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List, Dict

class ConnectionLineOut(BaseModel):
    name_from: str
    name_to: str
    x1: float
    y1: float
    x2: float
    y2: float

class FrameSkeletonOut(BaseModel):
    frame_number: int
    timestamp: float
    connections: List[ConnectionLineOut]
    joint_velocities: Dict[str, float]
    joint_accelerations: Dict[str, float]
    motion_trail: Dict[str, List[List[float]]]
    tracking_confidence: float

class SkeletonTrackingOut(BaseModel):
    id: str = Field(..., alias="_id")
    session_id: str
    video_id: str
    frames: List[FrameSkeletonOut]
    created_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}
