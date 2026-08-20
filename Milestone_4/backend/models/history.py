from pydantic import BaseModel, Field
from typing import List
from datetime import datetime

class AnalysisHistoryDB(BaseModel):
    athlete_id: str
    session_id: str
    analysis_date: datetime
    injury_risk_score: float = Field(..., ge=0, le=100)
    risk_category: str
    movement_quality_score: float = Field(..., ge=0, le=100)
    athlete_health_score: float = Field(..., ge=0, le=100)
    fatigue_risk_score: float = Field(..., ge=0, le=100)
    major_anomalies: List[str]
    major_injury_risks: List[str]
    created_at: datetime

    class Config:
        populate_by_name = True
