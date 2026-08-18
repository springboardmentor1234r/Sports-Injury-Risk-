from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.models.prediction import RiskLevel

class InjuryPredictionBase(BaseModel):
    analysis_id: int
    athlete_id: int
    risk_level: RiskLevel
    risk_score: float
    contributing_factors: List[Dict[str, Any]] = []

class InjuryPredictionCreate(InjuryPredictionBase):
    pass

class InjuryPredictionUpdate(BaseModel):
    risk_level: Optional[RiskLevel] = None
    risk_score: Optional[float] = None
    contributing_factors: Optional[List[Dict[str, Any]]] = None

class InjuryPredictionInDBBase(InjuryPredictionBase):
    id: int

    class Config:
        from_attributes = True

class InjuryPredictionResponse(InjuryPredictionInDBBase):
    pass
