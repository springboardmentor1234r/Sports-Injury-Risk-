from pydantic import BaseModel, EmailStr
from typing import Optional

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