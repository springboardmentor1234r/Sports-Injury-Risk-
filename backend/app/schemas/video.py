from datetime import datetime
from pydantic import BaseModel


class VideoResponse(BaseModel):
    id: int
    athlete_id: int
    file_name: str
    file_path: str
    status: str

    fps: float | None = None
    total_frames: int | None = None
    duration: float | None = None
    width: int | None = None
    height: int | None = None
    resolution: str | None = None

    uploaded_at: datetime

    class Config:
        from_attributes = True