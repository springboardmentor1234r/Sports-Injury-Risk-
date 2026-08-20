from pydantic import BaseModel
from typing import Optional

class VideoAnalysisBase(BaseModel):
    video_id: int
    status: str
    model_version: str

class VideoAnalysisCreate(VideoAnalysisBase):
    processing_time: float

class VideoAnalysisUpdate(BaseModel):
    status: Optional[str] = None
    processing_time: Optional[float] = None

class VideoAnalysisInDBBase(VideoAnalysisBase):
    id: int
    processing_time: float

    class Config:
        from_attributes = True

class VideoAnalysisResponse(VideoAnalysisInDBBase):
    pass
