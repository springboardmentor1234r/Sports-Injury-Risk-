from pydantic import BaseModel
from typing import List, Optional

class AthleteBase(BaseModel):
    age: int
    height: float
    weight: float
    gender: str
    sport: str
    position: str
    training_load: str
    previous_injuries: List[str] = []

class AthleteCreate(AthleteBase):
    user_id: int

class AthleteUpdate(BaseModel):
    age: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    gender: Optional[str] = None
    sport: Optional[str] = None
    position: Optional[str] = None
    training_load: Optional[str] = None
    previous_injuries: Optional[List[str]] = None

class AthleteInDBBase(AthleteBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class AthleteResponse(AthleteInDBBase):
    pass
