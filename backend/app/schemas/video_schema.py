from datetime import datetime
from pydantic import BaseModel


# ---------------------------------
# Joint Angles
# ---------------------------------

class JointAngles(BaseModel):
    left_elbow: float
    right_elbow: float
    left_knee: float
    right_knee: float
    left_hip: float
    right_hip: float


# ---------------------------------
# Risk Analysis
# ---------------------------------

class RiskAnalysis(BaseModel):
    risk_score: int
    risk_level: str
    remarks: list[str]


# ---------------------------------
# Range Of Motion
# ---------------------------------

class RangeOfMotion(BaseModel):
    average_rom: float
    status: str


# ---------------------------------
# Movement Symmetry
# ---------------------------------

class MovementSymmetry(BaseModel):
    difference: float
    symmetry_score: float


# ---------------------------------
# Hip Stability
# ---------------------------------

class HipStability(BaseModel):
    difference: float
    status: str


# ---------------------------------
# Biomechanics
# ---------------------------------

class Biomechanics(BaseModel):
    range_of_motion: RangeOfMotion
    movement_symmetry: MovementSymmetry
    hip_stability: HipStability
    balance_score: float
    joint_alignment: str
    movement_quality: float


# ---------------------------------
# Pose Analysis
# ---------------------------------

class PoseAnalysis(BaseModel):
    frames: int
    pose_detected: int
    success_rate: float
    processed_video: str

    joint_angles: JointAngles
    risk_analysis: RiskAnalysis
    biomechanics: Biomechanics


# ---------------------------------
# Video Response
# ---------------------------------

class VideoResponse(BaseModel):
    id: int
    athlete_id: int
    filename: str
    filepath: str
    uploaded_at: datetime

    analysis: PoseAnalysis

    class Config:
        from_attributes = True