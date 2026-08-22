from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, EmailStr, Field

from .models import AnalysisStatus, RoleEnum


class APIModel(BaseModel):
    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: RoleEnum = RoleEnum.athlete


class UserOut(APIModel):
    id: int
    full_name: str
    email: EmailStr
    role: RoleEnum
    created_at: datetime


class UserRoleUpdate(BaseModel):
    role: RoleEnum


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AthleteProfileBase(BaseModel):
    sport_type: Optional[str] = Field(default=None, max_length=100)
    position: Optional[str] = Field(default=None, max_length=100)
    age: Optional[int] = Field(default=None, ge=8, le=100)
    height_cm: Optional[float] = Field(default=None, ge=80, le=260)
    weight_kg: Optional[float] = Field(default=None, ge=20, le=350)
    injury_history: Optional[str] = Field(default=None, max_length=3000)
    training_load: Optional[str] = Field(default=None, pattern="^(low|moderate|high|)$")


class AthleteProfileUpdate(AthleteProfileBase):
    pass


class AthleteProfileOut(AthleteProfileBase, APIModel):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime


class AthleteSummary(AthleteProfileOut):
    full_name: str
    email: EmailStr
    latest_risk: Optional[float] = None
    risk_level: Optional[str] = None
    last_analysis_at: Optional[datetime] = None


class RiskAssessmentOut(APIModel):
    id: int
    analysis_id: int
    overall_risk: float
    risk_level: str
    movement_quality_score: float
    biomechanical_score: float
    symmetry_score: float
    fatigue_score: float
    metrics: dict[str, Any]
    injury_probabilities: dict[str, float]
    findings: list[str]
    recommendations: list[dict[str, str]]
    created_at: datetime


class VideoAnalysisOut(APIModel):
    id: int
    athlete_id: int
    athlete_name: str
    original_filename: str
    activity: str
    status: AnalysisStatus
    duration_seconds: Optional[float] = None
    fps: Optional[float] = None
    frame_count: Optional[int] = None
    quality_score: Optional[float] = None
    pose_confidence: Optional[float] = None
    pose_engine: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    processed_at: Optional[datetime] = None
    result: Optional[RiskAssessmentOut] = None


class NotificationOut(APIModel):
    id: int
    title: str
    message: str
    severity: str
    is_read: bool
    created_at: datetime


class DashboardOut(BaseModel):
    role: RoleEnum
    generated_at: datetime
    data: dict[str, Any]
