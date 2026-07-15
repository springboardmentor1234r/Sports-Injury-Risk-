from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr, ConfigDict

from app.models import RoleEnum


# ---------- Auth / User ----------

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: RoleEnum = RoleEnum.athlete


class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: RoleEnum
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ---------- Injury Records ----------

class InjuryRecordCreate(BaseModel):
    injury_type: str
    body_part: Optional[str] = None
    severity: Optional[str] = None
    recovery_status: Optional[str] = "Ongoing"
    description: Optional[str] = None


class InjuryRecordOut(InjuryRecordCreate):
    id: int
    date_occurred: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------- Athlete Profile ----------

class AthleteProfileCreate(BaseModel):
    sport_type: Optional[str] = None
    position: Optional[str] = None
    age: Optional[int] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    training_load: Optional[str] = None
    notes: Optional[str] = None


class AthleteProfileUpdate(AthleteProfileCreate):
    pass


class AthleteProfileOut(AthleteProfileCreate):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    injury_history: List[InjuryRecordOut] = []

    model_config = ConfigDict(from_attributes=True)


class AthleteProfileWithUser(AthleteProfileOut):
    user: UserOut
