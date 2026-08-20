from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class ReportResponse(BaseModel):
    athlete_id: str
    session_id: str
    report_id: str
    overall_injury_risk_score: float = Field(..., ge=0, le=100)
    risk_category: str
    injury_specific_risks: Dict[str, float]
    movement_anomalies: List[Dict[str, Any]]
    biomechanical_summary: Dict[str, Any]
    movement_quality_score: float = Field(..., ge=0, le=100)
    athlete_health_score: float = Field(..., ge=0, le=100)
    recommendations: List[Dict[str, Any]]
    data_limitations: List[str]
    analysis_timestamp: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
