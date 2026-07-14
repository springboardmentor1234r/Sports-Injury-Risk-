from datetime import datetime
from pydantic import BaseModel, Field, EmailStr
from app.models.user import UserRole

class UserRegister(BaseModel):
    email: str
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.ATHLETE

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: str
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "uuid-string",
                "email": "user@example.com",
                "role": "athlete",
                "is_active": True,
                "created_at": "2026-07-09T10:00:00"
            }
        }
