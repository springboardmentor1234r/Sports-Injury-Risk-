from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ATHLETE = "Athlete"
    COACH = "Coach"
    PHYSIOTHERAPIST = "Physiotherapist"
    SPORTS_SCIENTIST = "Sports Scientist"
    ADMINISTRATOR = "Administrator"

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    fullname: str = Field(..., min_length=2, description="Full name must be at least 2 characters")
    role: UserRole

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    fullname: str
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    fullname: Optional[str] = None
    # Add other placeholder fields for user profile details
    bio: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None

class TokenSchema(BaseModel):
    access_token: str
    token_type: str
    role: str
    fullname: str
    email: str

class AthleteProfileCreate(BaseModel):
    sport_type: str = Field(..., min_length=2)
    position: str = Field(..., min_length=2)
    age: int = Field(..., ge=1)
    height: float = Field(..., ge=1.0)
    weight: float = Field(..., ge=1.0)
    injury_history: str
    training_load: str
    assigned_coach: Optional[str] = None
    assigned_physio: Optional[str] = None

class AthleteProfileUpdate(BaseModel):
    sport_type: Optional[str] = None
    position: Optional[str] = None
    age: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    injury_history: Optional[str] = None
    training_load: Optional[str] = None
    assigned_coach: Optional[str] = None
    assigned_physio: Optional[str] = None

class AthleteProfileResponse(BaseModel):
    athlete_id: str
    email: EmailStr
    sport_type: str
    position: str
    age: int
    height: float
    weight: float
    injury_history: str
    training_load: str
    assigned_coach: Optional[str] = None
    assigned_physio: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CustomRecommendationCreate(BaseModel):
    athlete_id: str
    title: str
    category: str
    exercise_type: str
    priority: str
    body_region: str
    description: str
    duration: str
    frequency: str

