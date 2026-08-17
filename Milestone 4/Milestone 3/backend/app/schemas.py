from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Authentication Schemas ---
class UserRoleSelect(BaseModel):
    role: str = Field(..., description="Role: athlete, coach, physiotherapist, scientist, admin")

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    confirm_password: Optional[str] = None
    role: str  # athlete, coach, physiotherapist, scientist, admin
    phone_number: Optional[str] = ""

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    role: str
    phone_number: Optional[str] = ""
    is_active: bool = True
    created_at: str
    athlete_id: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# --- Athlete Profile Schemas ---
class AthleteCreate(BaseModel):
    name: str
    sport_type: str
    position: Optional[str] = "General"
    age: int
    height: float  # cm
    weight: float  # kg
    injury_history: Optional[str] = "None reported"
    training_load: Optional[str] = "Moderate"
    user_id: Optional[str] = None

class AthleteUpdate(BaseModel):
    name: Optional[str] = None
    sport_type: Optional[str] = None
    position: Optional[str] = None
    age: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    injury_history: Optional[str] = None
    training_load: Optional[str] = None

class AthleteResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    name: str
    sport_type: str
    position: str
    age: int
    height: float
    weight: float
    injury_history: str
    training_load: str
    recent_risk_score: float = 0.0
    risk_level: str = "Low"
    movement_quality_score: float = 80.0
    overall_health_score: float = 85.0
    sessions_analyzed: int = 0
    profile_image: Optional[str] = None
    created_at: str

# --- Biomechanical & Risk Schemas ---
class BiomechanicalMetrics(BaseModel):
    knee_angle: float
    hip_angle: float
    elbow_angle: float
    shoulder_angle: float
    trunk_lean: float
    knee_valgus: str  # Normal, Mild, Moderate, Severe
    hip_stability: str  # Excellent, Good, Fair, Poor
    movement_symmetry: float  # %
    range_of_motion: float  # %
    landing_mechanics: str  # Optimal, Suboptimal, Dynamic Valgus Detected
    joint_alignment: str  # Balanced, Asymmetric
    balance_score: float  # %
    overall_biomechanical_status: str

class InjuryPredictionResult(BaseModel):
    acl_risk: float
    hamstring_risk: float
    ankle_sprain_risk: float
    shoulder_risk: float
    lower_back_risk: float
    overuse_risk: float

class AnomalyResult(BaseModel):
    anomaly_detected: bool
    anomaly_score: float
    severity: str  # None, Mild, Moderate, Severe, Critical
    affected_area: str
    description: str

class RecommendationItem(BaseModel):
    id: Optional[str] = None
    athlete_id: str
    analysis_id: Optional[str] = None
    category: str  # Exercise, Mobility, Strengthening, Recovery, Training Modification
    title: str
    description: str
    priority: str  # Low, Medium, High, Critical
    target_area: str
    frequency: str
    reason: str
    status: str = "Pending"  # Pending, In Progress, Completed
    created_at: Optional[str] = None

class VideoAnalysisCreate(BaseModel):
    athlete_id: str
    video_name: str

class VideoAnalysisResponse(BaseModel):
    id: str
    athlete_id: str
    athlete_name: str
    video_name: str
    video_url: str
    frames_analyzed: int
    analysis_date: str
    overall_risk_score: float
    risk_level: str  # Low, Moderate, High, Critical
    movement_quality_score: float
    biomechanical_efficiency_score: float
    fatigue_risk_score: float
    overall_health_score: float
    biomechanics: BiomechanicalMetrics
    injury_predictions: InjuryPredictionResult
    anomaly_detection: AnomalyResult
    recommendations: List[RecommendationItem]

# --- Notification Schema ---
class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    priority: str  # Info, Warning, Critical
    is_read: bool = False
    created_at: str

# --- Report Schema ---
class ReportResponse(BaseModel):
    id: str
    athlete_id: str
    athlete_name: str
    analysis_id: str
    video_name: str
    generated_at: str
    overall_risk_score: float
    risk_level: str
    summary: str
    download_url: str
