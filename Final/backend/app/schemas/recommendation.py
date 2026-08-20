from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List

class RecommendationsOut(BaseModel):
    id: str = Field(..., alias="_id")
    athlete_id: str
    session_id: str
    recommendation_type: str  # "Corrective Exercises", "Mobility", "Strengthening", "Recovery", "Training/Load Modification", "Load Adjustment"
    title: str
    description: str
    priority: str  # "Low", "Medium", "High", "Critical"
    related_risk: Optional[str] = None
    related_anomaly: Optional[str] = None
    reason_evidence: str
    created_at: datetime

    class Config:
        populate_by_name = True

    @field_validator("recommendation_type")
    @classmethod
    def check_rec_type(cls, v):
        valid_types = {
            "Corrective Exercises",
            "Mobility",
            "Strengthening",
            "Recovery",
            "Training/Load Modification",
            "Load Adjustment"
        }
        if v not in valid_types:
            raise ValueError(f"recommendation_type must be one of {valid_types}")
        return v

    @field_validator("priority")
    @classmethod
    def check_priority(cls, v):
        valid_priorities = {"Low", "Medium", "High", "Critical"}
        if v not in valid_priorities:
            raise ValueError(f"priority must be one of {valid_priorities}")
        return v

class RecommendationsListResponse(BaseModel):
    recommendations: List[RecommendationsOut]
    total: int
