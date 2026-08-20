from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any

class InjuryRiskPredictionsOut(BaseModel):
    id: str = Field(..., alias="_id")
    athlete_id: str
    session_id: str
    video_id: str
    injury_type: str  # "ACL", "Hamstring", "Ankle Sprain", "Shoulder", "Lower Back", "Overuse"
    probability: float
    risk_level: str  # "Low", "Moderate", "High", "Critical"
    evidence: Dict[str, Any]
    explanation: str
    contributing_metrics: List[str]
    created_at: datetime

    class Config:
        populate_by_name = True

    @field_validator("probability")
    @classmethod
    def check_probability(cls, v):
        if not (0.0 <= v <= 100.0):
            raise ValueError("probability must be between 0.0 and 100.0")
        return v

    @field_validator("risk_level")
    @classmethod
    def check_risk_level(cls, v):
        valid_levels = {"Low", "Moderate", "High", "Critical"}
        if v not in valid_levels:
            raise ValueError(f"risk_level must be one of {valid_levels}")
        return v

class InjuryRiskPredictionsListResponse(BaseModel):
    predictions: List[InjuryRiskPredictionsOut]
    total: int
