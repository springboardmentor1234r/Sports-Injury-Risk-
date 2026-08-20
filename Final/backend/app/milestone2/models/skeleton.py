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

class ConnectionLine(BaseModel):
    name_from: str
    name_to: str
    x1: float
    y1: float
    x2: float
    y2: float

class FrameSkeletonData(BaseModel):
    frame_number: int
    timestamp: float
    connections: List[ConnectionLine] = Field(default_factory=list)
    joint_velocities: Dict[str, float] = Field(default_factory=dict)  # [JointName]: value
    joint_accelerations: Dict[str, float] = Field(default_factory=dict)  # [JointName]: value
    motion_trail: Dict[str, List[List[float]]] = Field(default_factory=dict)  # [JointName]: [[x,y], [x,y]]
    tracking_confidence: float

class SkeletonTrackingDB(BaseModel):
    id: Optional[PyObjectId] = Field(None, alias="_id")
    session_id: str = Field(...)  # References AnalysisSessions._id
    video_id: str = Field(...)  # References Videos._id
    frames: List[FrameSkeletonData] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
