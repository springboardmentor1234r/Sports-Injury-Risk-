from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# ============================================================
# INDIVIDUAL JOINT ANGLE
# ============================================================

class JointAngle(BaseModel):
    average: float | None = None
    minimum: float | None = None
    maximum: float | None = None
    samples: int | None = None
    analysis_available: bool | None = None


# ============================================================
# JOINT ANGLES
# ============================================================

class JointAngles(BaseModel):
    left_elbow: JointAngle
    right_elbow: JointAngle

    left_knee: JointAngle
    right_knee: JointAngle

    left_hip: JointAngle
    right_hip: JointAngle


# ============================================================
# RISK ANALYSIS
# ============================================================

class RiskAnalysis(BaseModel):
    analysis_available: bool | None = None

    risk_score: float | None = None
    risk_level: str = "Unknown"

    risk_factors: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)

    component_scores: dict[str, Any] = Field(
        default_factory=dict
    )

    joint_scores: dict[str, Any] = Field(
        default_factory=dict
    )

    remarks: list[str] = Field(
        default_factory=list
    )


# ============================================================
# RANGE OF MOTION
# ============================================================

class RangeOfMotion(BaseModel):
    average_rom: float | None = None
    observed_rom: float | None = None

    left_rom: float | None = None
    right_rom: float | None = None

    status: str | None = None
    analysis_available: bool | None = None


# ============================================================
# MOVEMENT SYMMETRY
# ============================================================

class MovementSymmetry(BaseModel):
    difference: float | None = None
    symmetry_score: float | None = None

    status: str | None = None
    analysis_available: bool | None = None


# ============================================================
# HIP STABILITY
# ============================================================

class HipStability(BaseModel):
    difference: float | None = None
    stability_score: float | None = None

    status: str | None = None
    analysis_available: bool | None = None


# ============================================================
# BIOMECHANICS
# ============================================================

class Biomechanics(BaseModel):
    analysis_available: bool | None = None

    range_of_motion: RangeOfMotion | dict[str, Any]

    movement_symmetry: MovementSymmetry | dict[str, Any]

    hip_stability: HipStability | dict[str, Any]

    balance_score: float | None = None

    joint_alignment: str | None = None

    movement_quality: float | None = None


# ============================================================
# ANOMALY DETECTION
# ============================================================

class AnomalyDetection(BaseModel):
    data_available: bool | None = None

    overall_anomaly_score: float | None = None

    severity: str | None = None

    anomaly_detected: bool | None = None

    anomaly_count: int | None = None

    asymmetry_count: int | None = None

    joint_analysis: dict[str, Any] = Field(
        default_factory=dict
    )

    asymmetry_analysis: dict[str, Any] = Field(
        default_factory=dict
    )

    samples_analyzed: dict[str, Any] = Field(
        default_factory=dict
    )

    remarks: list[str] = Field(
        default_factory=list
    )


# ============================================================
# INJURY PREDICTION
# ============================================================

class InjuryPrediction(BaseModel):
    highest_risk: dict[str, Any] = Field(
        default_factory=dict
    )

    injury_risks: list[dict[str, Any]] = Field(
        default_factory=list
    )

    overall_risk_score: float | None = None

    overall_risk_level: str | None = None

    analysis_inputs: dict[str, Any] = Field(
        default_factory=dict
    )


# ============================================================
# RECOMMENDATIONS
# ============================================================

class Recommendations(BaseModel):
    total_recommendations: int | None = None

    recommendations: list[Any] = Field(
        default_factory=list
    )

    analysis_status: str | None = None


# ============================================================
# POSE ANALYSIS
# ============================================================

class PoseAnalysis(BaseModel):
    frames: int

    pose_detected: int

    success_rate: float | None = None

    analysis_status: str | None = None

    processed_video: str | None = None

    joint_angles: JointAngles

    biomechanics: Biomechanics

    anomaly_detection: AnomalyDetection

    injury_prediction: InjuryPrediction

    risk_analysis: RiskAnalysis

    recommendations: Recommendations


# ============================================================
# VIDEO RESPONSE
# ============================================================

class VideoResponse(BaseModel):
    id: int

    athlete_id: int

    filename: str

    filepath: str

    uploaded_at: datetime

    analysis: PoseAnalysis | None = None

    class Config:
        from_attributes = True