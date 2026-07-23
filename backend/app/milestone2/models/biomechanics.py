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

class FrameBiomechanicsData(BaseModel):
    frame_number: int
    timestamp: float
    joint_angles: Dict[str, float] = Field(default_factory=dict)  # [AngleName]: degrees
    rom: Dict[str, Dict[str, float]] = Field(default_factory=dict)  # [AngleName]: {min, max, current}
    balance_offset: float
    trunk_lean: float
    symmetry_difference: float
    landing_angle: Optional[float] = None
    stride_length: Optional[float] = None

class BiomechanicsSummary(BaseModel):
    max_knee_flexion_left: float = 0.0
    max_knee_flexion_right: float = 0.0
    max_knee_valgus_left: float = 0.0
    max_knee_valgus_right: float = 0.0
    average_trunk_lean: float = 0.0
    average_balance_offset: float = 0.0
    mean_symmetry_index: float = 0.0
    max_rom_flexion_left: float = 0.0
    max_rom_flexion_right: float = 0.0
    peak_stride_length: float = 0.0
    landing_flexion_at_impact: float = 0.0

class BiomechanicsDB(BaseModel):
    id: Optional[PyObjectId] = Field(None, alias="_id")
    session_id: str = Field(...)  # References AnalysisSessions._id
    video_id: str = Field(...)  # References Videos._id
    frames: List[FrameBiomechanicsData] = Field(default_factory=list)
    summary: BiomechanicsSummary = Field(default_factory=BiomechanicsSummary)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
