import uuid
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class VideoStatus(str, Enum):
    UPLOADED = "uploaded"
    PREPROCESSING = "preprocessing"
    POSE_EXTRACTING = "pose_extracting"
    CNN_PROCESSING = "cnn_processing"
    LSTM_PROCESSING = "lstm_processing"
    ENSEMBLE_SCORING = "ensemble_scoring"
    COMPLETED = "completed"
    FAILED = "failed"

class VideoDoc(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    athlete_id: str
    filename: str
    file_path: str
    processed_file_path: Optional[str] = None
    status: VideoStatus = VideoStatus.UPLOADED
    activity_type: Optional[str] = None
    duration_seconds: Optional[float] = None
    fps: Optional[int] = None
    resolution: Optional[str] = None
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Flexible results storage for pipeline stages
    results: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        json_schema_extra = {
            "example": {
                "athlete_id": "athlete-uuid",
                "filename": "sprint_analysis.mp4",
                "file_path": "storage/videos/athlete-uuid/sprint_analysis.mp4",
                "status": "uploaded",
                "activity_type": "running",
                "duration_seconds": 12.4,
                "fps": 30,
                "resolution": "1920x1080"
            }
        }
