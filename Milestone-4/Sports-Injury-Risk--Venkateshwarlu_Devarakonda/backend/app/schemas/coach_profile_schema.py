from typing import Optional

from pydantic import BaseModel, Field


class CoachProfileCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=20)
    specialization: Optional[str] = Field(default=None, max_length=150)
    sport: Optional[str] = Field(default=None, max_length=100)
    experience: Optional[float] = Field(default=None, ge=0)
    organization: Optional[str] = Field(default=None, max_length=150)
    certification: Optional[str] = Field(default=None, max_length=200)


class CoachProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=100
    )
    phone: Optional[str] = Field(default=None, max_length=20)
    specialization: Optional[str] = Field(default=None, max_length=150)
    sport: Optional[str] = Field(default=None, max_length=100)
    experience: Optional[float] = Field(default=None, ge=0)
    organization: Optional[str] = Field(default=None, max_length=150)
    certification: Optional[str] = Field(default=None, max_length=200)


class CoachProfileResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    phone: Optional[str] = None
    specialization: Optional[str] = None
    sport: Optional[str] = None
    experience: Optional[float] = None
    organization: Optional[str] = None
    certification: Optional[str] = None

    class Config:
        from_attributes = True