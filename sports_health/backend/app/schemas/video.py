from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class VideoMetadataOut(BaseModel):
    id: str
    athlete_id: str
    filename: str
    upload_date: datetime
    status: str
    activity_type: str

    model_config = ConfigDict(from_attributes=True)