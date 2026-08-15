from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
import datetime

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

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

class UserResponse(UserBase):
    id: int
    created_at: datetime.datetime

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
