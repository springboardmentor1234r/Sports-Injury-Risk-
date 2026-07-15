from datetime import datetime, timezone
from pydantic import BaseModel, Field
from typing import Optional
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

class AthleteDB(BaseModel):
    id: Optional[PyObjectId] = Field(None, alias="_id")
    athlete_id: str = Field(...)  # E.g. ATH-001
    full_name: str = Field(...)
    age: int = Field(...)
    gender: str = Field(...)
    sport: str = Field(...)
    playing_position: str = Field(...)
    height: str = Field(...)
    weight: str = Field(...)
    training_load: str = Field(...)
    experience: str = Field(...)
    fitness_level: str = Field(...)
    medical_notes: str = Field(...)
    injury_history: str = Field(...)
    emergency_contact: str = Field(...)
    coach_name: str = Field(...)
    photo: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: str = Field(...)  # Operator email

    # Optional Fields
    disability_status: Optional[str] = None
    disability_type: Optional[str] = None
    assistive_device: Optional[str] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
