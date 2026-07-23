from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List, Dict

class FrameBiomechanicsOut(BaseModel):
    frame_number: int
    timestamp: float
    joint_angles: Dict[str, float]
    rom: Dict[str, Dict[str, float]]
    balance_offset: float
    trunk_lean: float
    symmetry_difference: float
    landing_angle: Optional[float] = None
    stride_length: Optional[float] = None

class BiomechanicsSummaryOut(BaseModel):
    max_knee_flexion_left: float
    max_knee_flexion_right: float
    max_knee_valgus_left: float
    max_knee_valgus_right: float
    average_trunk_lean: float
    average_balance_offset: float
    mean_symmetry_index: float
    max_rom_flexion_left: float
    max_rom_flexion_right: float
    peak_stride_length: float
    landing_flexion_at_impact: float

class BiomechanicsOut(BaseModel):
    id: str = Field(..., alias="_id")
    session_id: str
    video_id: str
    frames: List[FrameBiomechanicsOut]
    summary: BiomechanicsSummaryOut
    created_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}

class AnalysisStatusResponse(BaseModel):
    session_id: str
    video_id: str
    processing_status: str
    error_message: Optional[str] = None
    progress: int
