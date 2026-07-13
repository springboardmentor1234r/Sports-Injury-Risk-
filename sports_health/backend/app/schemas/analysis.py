# Analysis schema placeholder
from pydantic import BaseModel
from typing import Optional

class AthleteProfileCreate(BaseModel):
    sport_type: str
    position: Optional[str] = None
    age: int
    height: float  # in cm
    weight: float  # in kg
    injury_history: Optional[str] = None
    training_load: int = 5  # Scale 1-10

class AthleteProfileUpdate(BaseModel):
    sport_type: Optional[str] = None
    position: Optional[str] = None
    age: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    injury_history: Optional[str] = None
    training_load: Optional[int] = None

class AthleteProfileOut(AthleteProfileCreate):
    id: str
    user_id: str