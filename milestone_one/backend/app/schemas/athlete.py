from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional
from app.models.athlete import InjurySeverity

class AthleteCreate(BaseModel):
    user_id: str
    sport_type: Optional[str] = None
    position: Optional[str] = None
    age: Optional[int] = Field(None, ge=0)
    height: Optional[float] = Field(None, ge=0)
    weight: Optional[float] = Field(None, ge=0)

class AthleteUpdate(BaseModel):
    sport_type: Optional[str] = None
    position: Optional[str] = None
    age: Optional[int] = Field(None, ge=0)
    height: Optional[float] = Field(None, ge=0)
    weight: Optional[float] = Field(None, ge=0)

class InjuryCreate(BaseModel):
    injury_type: str
    body_part: str
    date_occurred: datetime
    severity: InjurySeverity
    recovery_status: str
    notes: Optional[str] = None

class TrainingLoadCreate(BaseModel):
    date: datetime
    load_score: int = Field(..., ge=0, le=10)
    session_type: str
    duration_minutes: int
