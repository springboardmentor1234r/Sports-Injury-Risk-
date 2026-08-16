from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from app.models.sql_models import UserRole

class UserRegister(BaseModel):
    full_name: str = Field(..., example="Alex Morgan")
    email: EmailStr = Field(..., example="alex.morgan@sportsmed.io")
    password: str = Field(..., min_length=6, example="SecurePass123!")
    role: UserRole = Field(default=UserRole.ATHLETE)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    full_name: Optional[str] = None
    email: str

class UserOut(BaseModel):
    user_id: int
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True
