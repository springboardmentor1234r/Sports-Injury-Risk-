from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any

class WeightedFactorsSchema(BaseModel):
    biomechanical_deviations: float = Field(..., description="Weight: 35%")
    historical_injury_factors: float = Field(..., description="Weight: 20%")
    movement_asymmetry: float = Field(..., description="Weight: 20%")
    training_load_indicators: float = Field(..., description="Weight: 15%")
    fatigue_indicators: float = Field(..., description="Weight: 10%")

    @field_validator("biomechanical_deviations", "historical_injury_factors", "movement_asymmetry", "training_load_indicators", "fatigue_indicators")
    @classmethod
    def check_weights(cls, v):
        if not (0.0 <= v <= 1.0):
            raise ValueError("weights must be between 0.0 and 1.0")
        return v

class RiskScoresOut(BaseModel):
    id: str = Field(..., alias="_id")
    athlete_id: str
    session_id: str
    video_id: str
    biomechanical_score: float
    history_score: float
    asymmetry_score: float
    load_score: float
    fatigue_score: float
    weighted_factors: WeightedFactorsSchema
    overall_injury_risk_score: float
    movement_quality_score: float
    biomechanical_efficiency_score: float
    fatigue_risk_score: float
    overall_athlete_health_score: float
    risk_category: str  # "Low", "Moderate", "High", "Critical"
    score_breakdown: Dict[str, Any]
    created_at: datetime

    class Config:
        populate_by_name = True

    @field_validator("overall_injury_risk_score", "movement_quality_score", "biomechanical_efficiency_score", "fatigue_risk_score", "overall_athlete_health_score")
    @classmethod
    def check_scores(cls, v):
        if not (0.0 <= v <= 100.0):
            raise ValueError("scores must be between 0.0 and 100.0")
        return v

    @field_validator("risk_category")
    @classmethod
    def check_risk_category(cls, v):
        valid_categories = {"Low", "Moderate", "High", "Critical"}
        if v not in valid_categories:
            raise ValueError(f"risk_category must be one of {valid_categories}")
        return v
