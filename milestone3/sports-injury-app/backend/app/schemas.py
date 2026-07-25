"""
schemas.py
-----------
Pydantic models define the "shape" of data going in and out of the API.
They are DIFFERENT from the database models in models.py:
  - models.py   = what's stored in the database
  - schemas.py  = what the API accepts/returns over HTTP (and validates)

Keeping these separate means we never accidentally expose a password hash
in an API response, for example.
"""

import uuid
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict, Field

from app.models import UserRole, InjurySeverity, RecoveryStatus, BodyPart, VideoStatus, ActivityType, RiskBand


# ---------- User / Auth schemas ----------

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: UserRole


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    full_name: str
    email: EmailStr
    role: UserRole
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Athlete Profile schemas ----------

class AthleteProfileBase(BaseModel):
    sport_type: Optional[str] = None
    position: Optional[str] = None
    age: Optional[int] = Field(default=None, ge=5, le=80)
    height_cm: Optional[float] = Field(default=None, gt=0, lt=300)
    weight_kg: Optional[float] = Field(default=None, gt=0, lt=300)


class AthleteProfileCreate(AthleteProfileBase):
    pass


class AthleteProfileUpdate(AthleteProfileBase):
    pass


class AthleteProfileOut(AthleteProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class AthleteProfileWithUser(AthleteProfileOut):
    user: UserOut


# ---------- Injury Record schemas ----------

class InjuryRecordBase(BaseModel):
    body_part: BodyPart
    injury_type: str
    severity: InjurySeverity
    recovery_status: RecoveryStatus = RecoveryStatus.active
    date_occurred: date
    expected_recovery_date: Optional[date] = None
    actual_recovery_date: Optional[date] = None
    notes: Optional[str] = None


class InjuryRecordCreate(InjuryRecordBase):
    pass


class InjuryRecordUpdate(BaseModel):
    body_part: Optional[BodyPart] = None
    injury_type: Optional[str] = None
    severity: Optional[InjurySeverity] = None
    recovery_status: Optional[RecoveryStatus] = None
    date_occurred: Optional[date] = None
    expected_recovery_date: Optional[date] = None
    actual_recovery_date: Optional[date] = None
    notes: Optional[str] = None


class InjuryRecordOut(InjuryRecordBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    athlete_profile_id: uuid.UUID
    recorded_by_user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


# ---------- Performance Metric schemas ----------

class PerformanceMetricBase(BaseModel):
    metric_name: str
    metric_value: float
    unit: str
    recorded_date: date
    notes: Optional[str] = None


class PerformanceMetricCreate(PerformanceMetricBase):
    pass


class PerformanceMetricOut(PerformanceMetricBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    athlete_profile_id: uuid.UUID
    recorded_by_user_id: uuid.UUID
    created_at: datetime


# ---------- Physical Assessment schemas ----------

class PhysicalAssessmentBase(BaseModel):
    assessment_type: str
    assessment_date: date
    findings: Optional[str] = None
    recommendations: Optional[str] = None
    follow_up_required: bool = False


class PhysicalAssessmentCreate(PhysicalAssessmentBase):
    pass


class PhysicalAssessmentOut(PhysicalAssessmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    athlete_profile_id: uuid.UUID
    assessor_user_id: uuid.UUID
    created_at: datetime


# ---------- Training Load schemas ----------

class TrainingLoadEntryBase(BaseModel):
    session_date: date
    session_type: str
    duration_minutes: int = Field(gt=0, le=1440)
    intensity_rpe: Optional[int] = Field(default=None, ge=1, le=10)
    notes: Optional[str] = None


class TrainingLoadEntryCreate(TrainingLoadEntryBase):
    pass


class TrainingLoadEntryOut(TrainingLoadEntryBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    athlete_profile_id: uuid.UUID
    recorded_by_user_id: uuid.UUID
    created_at: datetime


# ---------- Video schemas ----------

class VideoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    athlete_profile_id: uuid.UUID
    uploaded_by_user_id: uuid.UUID
    activity_type: ActivityType
    original_filename: str
    status: VideoStatus
    error_message: Optional[str] = None
    duration_seconds: Optional[float] = None
    fps: Optional[float] = None
    frame_count: Optional[int] = None
    analyzed_frame_count: Optional[int] = None
    uploaded_at: datetime
    processed_at: Optional[datetime] = None


class JointAngleStats(BaseModel):
    min: float
    max: float
    avg: float
    range_of_motion: float
    unit: str
    sample_count: int


class VideoAnalysisSummary(BaseModel):
    video: VideoOut
    joint_angles: dict[str, Optional[JointAngleStats]]
    knee_symmetry_score: Optional[float] = None
    knee_symmetry_lsi_percent: Optional[float] = None


class VideoFrameOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    frame_number: int
    timestamp_seconds: float
    pose_detected: bool
    left_knee_angle: Optional[float] = None
    right_knee_angle: Optional[float] = None
    left_hip_angle: Optional[float] = None
    right_hip_angle: Optional[float] = None
    left_elbow_angle: Optional[float] = None
    right_elbow_angle: Optional[float] = None
    trunk_lean_angle: Optional[float] = None
    left_knee_deviation_angle: Optional[float] = None
    right_knee_deviation_angle: Optional[float] = None


# ---------- Risk Assessment schemas ----------

class RiskAssessmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    athlete_profile_id: uuid.UUID
    based_on_video_id: Optional[uuid.UUID] = None
    overall_score: float
    risk_band: RiskBand
    biomechanical_score: Optional[float] = None
    asymmetry_score: Optional[float] = None
    historical_injury_score: Optional[float] = None
    training_load_score: Optional[float] = None
    fatigue_score: Optional[float] = None
    breakdown: Optional[list[str]] = None
    data_completeness_warnings: Optional[list[str]] = None
    computed_by_user_id: uuid.UUID
    computed_at: datetime
