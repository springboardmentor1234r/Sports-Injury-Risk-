from datetime import datetime, timezone
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
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

class InjuryRiskPredictionsDB(BaseModel):
    id: Optional[PyObjectId] = Field(None, alias="_id")
    athlete_id: str = Field(...)
    session_id: str = Field(...)
    video_id: str = Field(...)
    injury_type: str = Field(...)  # "ACL", "Hamstring", "Ankle Sprain", "Shoulder", "Lower Back", "Overuse"
    probability: float = Field(...)  # 0.0 to 100.0 percentage
    risk_level: str = Field(...)   # "Low", "Moderate", "High", "Critical"
    evidence: Dict[str, Any] = Field(default_factory=dict)
    explanation: str = Field(...)
    contributing_metrics: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
