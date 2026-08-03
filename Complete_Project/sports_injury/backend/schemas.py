from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "athlete"

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str

class AthleteCreate(BaseModel):
    sport: str
    position: str
    age: int
    height: float
    weight: float
    injury_history: Optional[str] = ""
    training_load: Optional[str] = ""

class AthleteResponse(AthleteCreate):
    athlete_id: int
    user_id: int
    class Config:
        from_attributes = True

# ---- Milestone 2 schemas ----

class VideoOut(BaseModel):
    id: int
    athlete_id: int
    filename: str
    activity_type: str
    status: str
    duration_seconds: Optional[float] = None
    fps: Optional[float] = None
    total_frames: Optional[int] = None
    error_message: Optional[str] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True

class PoseFrameOut(BaseModel):
    frame_number: int
    timestamp_ms: float
    keypoints: Dict[str, Any]
    joint_angles: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class BiomechanicsReportOut(BaseModel):
    avg_knee_valgus_left: Optional[float] = None
    avg_knee_valgus_right: Optional[float] = None
    knee_valgus_asymmetry: Optional[float] = None
    avg_trunk_lean: Optional[float] = None
    movement_symmetry_score: Optional[float] = None
    movement_quality_score: Optional[float] = None
    rom_summary: Optional[Dict[str, Any]] = None
    generated_at: datetime

    class Config:
        from_attributes = True

# ---- Milestone 3 schemas: Injury Risk Prediction / Anomaly Detection /
# Risk Scoring / Corrective Recommendations (PDF sections 6, 7, 8, 9) ----

class InjuryRiskAssessmentOut(BaseModel):
    biomechanical_deviation_score: Optional[float] = None
    historical_injury_score: Optional[float] = None
    movement_asymmetry_score: Optional[float] = None
    training_load_score: Optional[float] = None
    fatigue_score: Optional[float] = None
    overall_injury_risk_score: Optional[float] = None
    overall_athlete_health_score: Optional[float] = None
    risk_category: Optional[str] = None
    injury_type_risks: Optional[Dict[str, Any]] = None
    anomalies_detected: Optional[List[Dict[str, Any]]] = None
    fatigue_detected: Optional[str] = None
    recommendations: Optional[List[Dict[str, Any]]] = None
    generated_at: datetime

    class Config:
        from_attributes = True

class VideoRiskSummary(BaseModel):
    video_id: int
    activity_type: str
    uploaded_at: datetime
    overall_injury_risk_score: Optional[float] = None
    risk_category: Optional[str] = None

class AthleteRiskOverviewOut(BaseModel):
    athlete_id: int
    latest_assessment: Optional[InjuryRiskAssessmentOut] = None
    history: List[VideoRiskSummary] = []

class TeamRiskOverviewItem(BaseModel):
    athlete_id: int
    owner_name: str
    sport: str
    latest_risk_score: Optional[float] = None
    latest_risk_category: Optional[str] = None
    videos_analyzed: int

# ---- Staff / Admin schemas (role-based athlete access) ----

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    bio: Optional[str] = None
    profile_picture: Optional[str] = None

    class Config:
        from_attributes = True

# ---- Account Settings schemas ----

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    bio: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class AthleteWithOwnerOut(BaseModel):
    athlete_id: int
    user_id: int
    owner_name: str
    owner_email: str
    sport: str
    position: str
    age: int
    height: float
    weight: float
    injury_history: Optional[str] = ""
    training_load: Optional[str] = ""

class AssignmentCreate(BaseModel):
    staff_user_id: int
    athlete_id: int

class AssignmentOut(BaseModel):
    id: int
    staff_user_id: int
    staff_name: str
    staff_role: str
    athlete_id: int
    athlete_name: str
    assigned_at: datetime

# ---- Milestone 4 schemas: Notification & Alert System (PDF section 11) ----

class NotificationOut(BaseModel):
    id: int
    video_id: Optional[int] = None
    athlete_id: Optional[int] = None
    type: str
    severity: str
    title: str
    message: str
    is_read: str
    created_at: datetime

    class Config:
        from_attributes = True

# ---- Milestone 4 schemas: Admin "executive dashboard" (PDF section 10 Admin Dashboard) ----

class PlatformAnalyticsOut(BaseModel):
    total_users: int
    users_by_role: Dict[str, int]
    total_athletes: int
    total_videos: int
    videos_by_status: Dict[str, int]
    total_risk_assessments: int
    risk_category_distribution: Dict[str, int]
    avg_overall_injury_risk_score: Optional[float] = None

class SystemMonitoringOut(BaseModel):
    status: str
    database_connected: bool
    videos_processing: int
    videos_failed: int
    total_pose_frames_tracked: int
    generated_at: datetime

# ---- Milestone 4 schemas: Staff "executive dashboard" analytics (PDF section 10) ----

class StaffAnalyticsOverviewOut(BaseModel):
    athletes_covered: int
    videos_analyzed: int
    avg_team_risk_score: Optional[float] = None
    team_risk_distribution: Dict[str, int]
    avg_movement_quality_score: Optional[float] = None
    avg_knee_valgus_asymmetry: Optional[float] = None
    avg_trunk_lean: Optional[float] = None
    most_common_anomaly_types: Dict[str, int]