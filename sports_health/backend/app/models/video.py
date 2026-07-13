from beanie import Document
from datetime import datetime
from typing import Optional

class VideoMetadata(Document):
    athlete_id: str
    filename: str
    file_path: str
    upload_date: datetime = datetime.utcnow()
    status: str = "pending"  # pending, processing, completed, failed
    activity_type: str  # e.g., "squat", "running", "jumping" (From Page 4)
    
    class Settings:
        name = "video_metadata"