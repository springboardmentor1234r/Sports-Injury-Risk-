from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List

class MovementAnomaliesOut(BaseModel):
    id: str = Field(..., alias="_id")
    athlete_id: str
    session_id: str
    video_id: str
    anomaly_type: str
    frame_number: int
    severity: str  # "Low", "Moderate", "High", "Critical"
    affected_joint: str
    observed_value: float
    expected_value: float
    description: str
    created_at: datetime

    class Config:
        populate_by_name = True

    @field_validator("frame_number")
    @classmethod
    def check_frame_number(cls, v):
        if v < 0:
            raise ValueError("frame_number must be non-negative")
        return v

    @field_validator("severity")
    @classmethod
    def check_severity(cls, v):
        valid_severities = {"Low", "Moderate", "High", "Critical"}
        if v not in valid_severities:
            raise ValueError(f"severity must be one of {valid_severities}")
        return v

class MovementAnomaliesListResponse(BaseModel):
    anomalies: List[MovementAnomaliesOut]
    total: int
