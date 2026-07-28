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

# ---- Staff / Admin schemas (role-based athlete access) ----

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True

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