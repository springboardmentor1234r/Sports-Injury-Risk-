from pydantic import BaseModel, EmailStr
from typing import Optional
from models import UserRole
from decimal import Decimal

class AthleteCreate(BaseModel):
    sport_type: Optional[str] = None
    position: Optional[str] = None
    age: Optional[int] = None
    height_cm: Optional[Decimal] = None
    weight_kg: Optional[Decimal] = None
    injury_history: Optional[str] = None
    training_load: Optional[str] = None

class AthleteUpdate(AthleteCreate):
    pass  # same fields, all optional — used for partial updates

class AthleteOut(AthleteCreate):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.athlete

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"