from datetime import datetime, timezone
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, handler=None):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.is_instance_schema(ObjectId),
            serialization=core_schema.plain_serializer_function_ser_schema(str),
        )

class WeightedFactors(BaseModel):
    biomechanical_deviations: float = Field(default=0.35, description="Weight: 35%")
    historical_injury_factors: float = Field(default=0.20, description="Weight: 20%")
    movement_asymmetry: float = Field(default=0.20, description="Weight: 20%")
    training_load_indicators: float = Field(default=0.15, description="Weight: 15%")
    fatigue_indicators: float = Field(default=0.10, description="Weight: 10%")

class RiskScoresDB(BaseModel):
    id: Optional[PyObjectId] = Field(None, alias="_id")
    athlete_id: str = Field(...)
    session_id: str = Field(...)
    video_id: str = Field(...)
    
    # Normalized component scores (0 - 100)
    biomechanical_score: float = Field(...)
    history_score: float = Field(...)
    asymmetry_score: float = Field(...)
    load_score: float = Field(...)
    fatigue_score: float = Field(...)
    
    # Audit log / config of weight splits
    weighted_factors: WeightedFactors = Field(default_factory=WeightedFactors)
    
    # Calculated final outcomes
    overall_injury_risk_score: float = Field(...)
    movement_quality_score: float = Field(...)
    biomechanical_efficiency_score: float = Field(...)
    fatigue_risk_score: float = Field(...)
    overall_athlete_health_score: float = Field(...)
    
    risk_category: str = Field(...)  # "Low", "Moderate", "High", "Critical"
    score_breakdown: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
