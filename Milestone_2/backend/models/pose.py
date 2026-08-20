from datetime import datetime, timezone
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
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

class LandmarkData(BaseModel):
    name: str
    x: float
    y: float
    z: float
    visibility: float

class FramePoseData(BaseModel):
    frame_number: int
    timestamp: float
    landmarks: List[LandmarkData]
    average_confidence: float

class PoseAnalysisDB(BaseModel):
    id: Optional[PyObjectId] = Field(None, alias="_id")
    video_id: str = Field(...)  # References Videos._id or VideoDB.video_id
    session_id: str = Field(...)  # References AnalysisSessions._id
    frames: List[FramePoseData] = Field(default_factory=list)
    processing_status: str = Field(default="processing")  # processing, completed, failed
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
