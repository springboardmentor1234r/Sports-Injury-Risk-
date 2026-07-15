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
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict

from app.models import UserRole


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
    age: Optional[int] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    injury_history: Optional[str] = None
    training_load: Optional[str] = None


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
