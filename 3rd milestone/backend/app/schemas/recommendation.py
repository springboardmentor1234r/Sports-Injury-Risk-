from pydantic import BaseModel
from typing import Optional

class RecommendationBase(BaseModel):
    prediction_id: int
    exercise_type: str
    description: str
    priority: int = 1

class RecommendationCreate(RecommendationBase):
    pass

class RecommendationUpdate(BaseModel):
    exercise_type: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[int] = None

class RecommendationInDBBase(RecommendationBase):
    id: int

    class Config:
        from_attributes = True

class RecommendationResponse(RecommendationInDBBase):
    pass
