"""
models.py
----------
Pydantic response models for the
Sports Injury Risk Detection API.
"""

from pydantic import BaseModel
from typing import List


# ------------------------------------------------------
# Prediction Models
# ------------------------------------------------------

class PredictionResult(BaseModel):
    acl_risk: str
    hamstring_risk: str
    shoulder_risk: str
    gait_symmetry: str


class PredictionResponse(BaseModel):
    timestamp: str
    predictions: PredictionResult


# ------------------------------------------------------
# Risk Models
# ------------------------------------------------------

class RiskReport(BaseModel):
    overall_score: int
    overall_risk: str


class RiskResponse(BaseModel):
    timestamp: str
    risk_report: RiskReport


# ------------------------------------------------------
# Anomaly Models
# ------------------------------------------------------

class AnomalyResult(BaseModel):
    knee: str
    hip: str
    shoulder: str
    gait: str


class AnomalyResponse(BaseModel):
    timestamp: str
    anomalies: AnomalyResult


# ------------------------------------------------------
# Recommendation Models
# ------------------------------------------------------

class RecommendationResult(BaseModel):
    overall_risk: str
    recommendations: List[str]


class RecommendationResponse(BaseModel):
    timestamp: str
    recommendations: RecommendationResult


# ------------------------------------------------------
# Complete Report
# ------------------------------------------------------

class CompleteReportResponse(BaseModel):
    timestamp: str
    predictions: PredictionResult
    risk_report: RiskReport
    anomalies: AnomalyResult
    recommendations: RecommendationResult