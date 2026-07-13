from datetime import datetime
from typing import Any, Dict, List

from beanie import Document


class AnalysisResult(Document):
    video_id: str
    athlete_id: str
    activity_type: str
    frames_data: List[Dict[str, Any]]
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "analysis_results"
