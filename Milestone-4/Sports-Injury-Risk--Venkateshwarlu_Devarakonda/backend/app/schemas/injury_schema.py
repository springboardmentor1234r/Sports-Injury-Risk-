from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# -----------------------------------------
# Create Injury Report
# -----------------------------------------

class InjuryReportCreate(BaseModel):
    video_id: int

    injury_risk: float
    risk_level: str

    body_part: str
    recommendation: str

    movement_quality: float
    balance_score: float
    symmetry_score: float
    range_of_motion: float


# -----------------------------------------
# Update Injury Report
# -----------------------------------------

class InjuryReportUpdate(BaseModel):
    injury_risk: Optional[float] = None
    risk_level: Optional[str] = None

    body_part: Optional[str] = None
    recommendation: Optional[str] = None

    movement_quality: Optional[float] = None
    balance_score: Optional[float] = None
    symmetry_score: Optional[float] = None
    range_of_motion: Optional[float] = None

    doctor_notes: Optional[str] = None
    physio_notes: Optional[str] = None
    coach_notes: Optional[str] = None

    status: Optional[str] = None


# -----------------------------------------
# Response Schema
# -----------------------------------------

class InjuryReportResponse(BaseModel):
    id: int

    athlete_id: int
    video_id: int

    injury_risk: float
    risk_level: str

    body_part: str
    recommendation: str

    movement_quality: float
    balance_score: float
    symmetry_score: float
    range_of_motion: float

    doctor_notes: Optional[str] = None
    physio_notes: Optional[str] = None
    coach_notes: Optional[str] = None

    status: str

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True