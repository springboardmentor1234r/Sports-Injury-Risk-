from datetime import datetime
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from app.models.user import UserRole

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    role: UserRole

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    email: EmailStr
    role: UserRole
    createdAt: datetime = Field(..., alias="created_at")

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}
        arbitrary_types_allowed = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    id: str
    email: EmailStr
    role: str
