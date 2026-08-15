from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
import datetime
import re

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: Optional[str] = None

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[int] = None


# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "athlete" # athlete, coach, physiotherapist, admin

class UserCreate(UserBase):
    password: str

    @validator("password")
    def check_password_strength(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters.")
        return v

class UserResponse(UserBase):
    id: int
    created_at: datetime.datetime
    is_verified: bool = False

    class Config:
        orm_mode = True
        from_attributes = True


# --- Athlete Schemas ---
class AthleteBase(BaseModel):
    date_of_birth: Optional[datetime.date] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    sport: Optional[str] = None
    bio: Optional[str] = None

class AthleteCreate(AthleteBase):
    pass

class AthleteUpdate(AthleteBase):
    pass

class AthleteResponse(AthleteBase):
    id: int
    user_id: int
    user: UserResponse

    class Config:
        orm_mode = True
        from_attributes = True


# --- Injury History Schemas ---
class InjuryHistoryBase(BaseModel):
    injury_type: str
    body_part: str
    severity: str # low, medium, high
    occurrence_date: datetime.date
    status: str = "active" # active, rehab, recovered
    notes: Optional[str] = None

class InjuryHistoryCreate(InjuryHistoryBase):
    pass

class InjuryHistoryResponse(InjuryHistoryBase):
    id: int
    athlete_id: int

    class Config:
        orm_mode = True
        from_attributes = True


# --- Training Load Schemas ---
class TrainingLoadBase(BaseModel):
    date: datetime.date
    activity_type: str
    duration_minutes: int
    rpe: int = Field(..., ge=1, le=10) # 1-10 rate of perceived exertion
    notes: Optional[str] = None

class TrainingLoadCreate(TrainingLoadBase):
    pass

class TrainingLoadResponse(TrainingLoadBase):
    id: int
    athlete_id: int
    calculated_load: int

    class Config:
        orm_mode = True
        from_attributes = True


# --- Video Schemas ---
class VideoBase(BaseModel):
    title: str
    description: Optional[str] = None
    dataset_source: Optional[str] = "custom" # Human3.6M, MPII, COCO, SportsPose, custom

class VideoCreate(VideoBase):
    file_path: str

class VideoResponse(VideoBase):
    id: int
    athlete_id: int
    file_path: str
    status: str
    uploaded_at: datetime.datetime
    
    # Kinematic tracking outputs
    skeletal_data: Optional[str] = None
    movement_score: Optional[float] = None
    analysis_summary: Optional[str] = None

    class Config:
        orm_mode = True
        from_attributes = True


# --- Extended Profile Response ---
class FullAthleteProfile(AthleteResponse):
    injury_history: List[InjuryHistoryResponse] = []
    training_load: List[TrainingLoadResponse] = []
    videos: List[VideoResponse] = []

    class Config:
        orm_mode = True
        from_attributes = True


# --- Pose Dataset Info Schemas ---
class DatasetInfo(BaseModel):
    name: str
    description: str
    keypoints_count: int
    joints_format: str # e.g. "2D", "3D"
    total_images_videos: str
    sample_annotation_structure: dict


# --- Verification & Account Recovery Schemas ---
class VerifyAccount(BaseModel):
    email: str
    token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordConfirm(BaseModel):
    token: str
    new_password: str

class TokenRefreshRequest(BaseModel):
    refresh_token: str


# --- ML Analytics & Workload Schemas ---
class ACWRMetrics(BaseModel):
    acute_workload: float
    chronic_workload: float
    acwr: float
    status: str # "under-trained", "optimal", "over-trained"
    risk_factor: str # "low", "medium", "high"

class BiomechanicalMetrics(BaseModel):
    max_extension_angle: float
    max_flexion_angle: float
    flexion_velocity: float
    symmetry_index: float
    posture_deviation_score: float

class InjuryPredictionResponse(BaseModel):
    injury_risk_pct: float
    risk_level: str # "Low", "Medium", "High"
    primary_factors: List[str]
    acwr_metrics: ACWRMetrics
    recommended_recovery_days: int
    rehab_exercises: List[str]


# --- Admin Dashboard Schemas ---
class AdminDashboardStats(BaseModel):
    total_users: int
    total_athletes: int
    total_videos: int
    analyzed_videos: int
    critical_injury_alerts: int
    system_load_status: str


# --- Athlete Intelligence (rule-based analytical estimates; not medical diagnoses) ---
class MovementAnomalyResponse(BaseModel):
    id: int
    anomaly_type: str
    severity: str
    frame_index: Optional[int] = None
    body_region: str
    explanation: str
    recommended_action: str
    detected_at: datetime.datetime
    class Config:
        orm_mode = True
        from_attributes = True

class RecommendationResponse(BaseModel):
    id: int
    category: str
    priority: str
    recommendation: str
    rationale: str
    created_at: datetime.datetime
    class Config:
        orm_mode = True
        from_attributes = True

class IntelligenceAssessmentResponse(BaseModel):
    id: int
    athlete_id: int
    video_id: Optional[int] = None
    assessed_at: datetime.datetime
    injury_risk_score: float
    risk_category: str
    risk_probability: float
    movement_quality_score: float
    biomechanical_efficiency_score: float
    fatigue_risk_score: float
    health_score: float
    scoring_breakdown: Dict[str, Any]
    risk_predictions: List[Dict[str, Any]]
    explanation: str
    anomalies: List[MovementAnomalyResponse] = []
    recommendations: List[RecommendationResponse] = []
    analytical_disclaimer: str = "Analytical risk estimate only; it is not a medical diagnosis or validated clinical prediction."

class ExecutiveDashboardResponse(BaseModel):
    total_athletes: int
    total_analyzed_videos: int
    risk_distribution: Dict[str, int]
    high_risk_athletes: List[Dict[str, Any]]
    recent_anomalies: List[MovementAnomalyResponse]
    recent_assessments: List[Dict[str, Any]]
    team_averages: Dict[str, float]
