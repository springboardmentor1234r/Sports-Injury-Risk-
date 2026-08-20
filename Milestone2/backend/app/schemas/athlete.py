from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime

class InjuryHistoryCreate(BaseModel):
    injury_type: str = Field(..., example="ACL Tear")
    recovery_status: str = Field(..., example="Recovered") # e.g. Active Rehab, Recovered
    date_of_injury: str = Field(..., example="2024-05-12")

class InjuryHistoryOut(InjuryHistoryCreate):
    history_id: int
    user_id: int

    class Config:
        from_attributes = True

class AthleteProfileCreate(BaseModel):
    athlete_id: str = Field(..., example="ATH-8849")
    sport_type: str = Field(..., example="Soccer")
    position: Optional[str] = Field(None, example="Forward")
    age: int = Field(..., ge=10, le=100, example=24)
    height: float = Field(..., ge=50, le=250, example=178.5) # in cm
    weight: float = Field(..., ge=30, le=250, example=72.0) # in kg
    training_load: float = Field(default=1.2, example=1.35) # Acute:Chronic ratio or hrs/wk
    coach_id: Optional[int] = Field(None, example=2)
    physio_id: Optional[int] = Field(None, example=3)
    injury_history: Optional[List[InjuryHistoryCreate]] = []

class AthleteProfileOut(BaseModel):
    profile_id: int
    user_id: int
    athlete_id: str
    sport_type: str
    position: Optional[str] = None
    age: int
    height: float
    weight: float
    training_load: float
    coach_id: Optional[int] = None
    physio_id: Optional[int] = None

    class Config:
        from_attributes = True

class PhysicalAssessmentCreate(BaseModel):
    metrics_summary: dict = Field(..., example={
        "risk_score": 24,
        "knee_flexion_deg": 128.5,
        "valgus_angle_deg": 4.2,
        "symmetry_index": 94.8
    })

class PhysicalAssessmentOut(BaseModel):
    assessment_id: int
    user_id: int
    assessment_date: datetime
    metrics_summary: dict

    class Config:
        from_attributes = True

class FullAthleteOnboarding(BaseModel):
    user_data: Any # UserRegister
    athlete_profile: AthleteProfileCreate
