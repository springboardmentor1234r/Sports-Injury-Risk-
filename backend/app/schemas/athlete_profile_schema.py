from pydantic import BaseModel, Field


class AthleteProfileCreate(BaseModel):
    age: int = Field(..., ge=10, le=100)
    gender: str
    height: float = Field(..., gt=0)
    weight: float = Field(..., gt=0)
    sport: str
    experience: float = Field(..., ge=0)
    position: str | None = None

class AthleteProfileUpdate(BaseModel):
    age: int
    gender: str
    height: float
    weight: float
    sport: str
    experience: float
    position: str

class AthleteProfileResponse(BaseModel):
    id: int
    user_id: int
    age: int
    gender: str
    height: float
    weight: float
    sport: str
    experience: float
    position: str | None = None

    class Config:
        from_attributes = True