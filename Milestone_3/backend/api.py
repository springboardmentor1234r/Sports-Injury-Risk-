"""
api.py
-----------------------------------------
FastAPI Backend for Sports Injury Risk Detection
-----------------------------------------
"""

from datetime import datetime

from fastapi import FastAPI

from .injury_prediction.predictor import InjuryPredictor
from .injury_prediction.risk_scoring import RiskScoringEngine
from .injury_prediction.anomaly_detector import MovementAnomalyDetector
from .injury_prediction.recommendation_engine import RecommendationEngine

from .models import (
    PredictionResponse,
    RiskResponse,
    AnomalyResponse,
    RecommendationResponse,
    CompleteReportResponse,
)

# ==========================================================
# FastAPI Application
# ==========================================================

app = FastAPI(
    title="Sports Injury Risk Detection API",
    description="""
REST API for Sports Injury Risk Detection using
Pose Estimation and Biomechanical Analysis.
""",
    version="1.0.0",
)

DATA_FOLDER = "Milestone 2/outputs"


def get_timestamp():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


# ==========================================================
# HOME
# ==========================================================

@app.get("/", tags=["General"])
def home():

    return {
        "project": "Sports Injury Risk Detection",
        "version": "1.0.0",
        "status": "Running",
        "timestamp": get_timestamp(),
        "available_endpoints": [
            "/health",
            "/predict",
            "/risk",
            "/anomalies",
            "/recommendations",
            "/report",
            "/docs"
        ]
    }


# ==========================================================
# HEALTH
# ==========================================================

@app.get("/health", tags=["General"])
def health():

    return {
        "status": "Healthy",
        "service": "Sports Injury Risk Detection API",
        "version": "1.0.0",
        "timestamp": get_timestamp()
    }


# ==========================================================
# PREDICT
# ==========================================================

@app.get(
    "/predict",
    response_model=PredictionResponse,
    tags=["Prediction"]
)
def predict():

    predictor = InjuryPredictor(DATA_FOLDER)

    result = predictor.predict()

    return PredictionResponse(
        timestamp=get_timestamp(),
        predictions={
            "acl_risk": result["ACL Risk"],
            "hamstring_risk": result["Hamstring Risk"],
            "shoulder_risk": result["Shoulder Risk"],
            "gait_symmetry": result["Gait Symmetry"]
        }
    )


# ==========================================================
# RISK
# ==========================================================

@app.get(
    "/risk",
    response_model=RiskResponse,
    tags=["Risk Analysis"]
)
def risk():

    scorer = RiskScoringEngine(DATA_FOLDER)

    report = scorer.generate_report()

    return RiskResponse(
        timestamp=get_timestamp(),
        risk_report={
            "overall_score": report["Overall Score"],
            "overall_risk": report["Overall Risk"]
        }
    )


# ==========================================================
# ANOMALIES
# ==========================================================

@app.get(
    "/anomalies",
    response_model=AnomalyResponse,
    tags=["Movement Analysis"]
)
def anomalies():

    detector = MovementAnomalyDetector(DATA_FOLDER)

    result = detector.analyze()

    return AnomalyResponse(
        timestamp=get_timestamp(),
        anomalies={
            "knee": result["Knee"],
            "hip": result["Hip"],
            "shoulder": result["Shoulder"],
            "gait": result["Gait"]
        }
    )


# ==========================================================
# RECOMMENDATIONS
# ==========================================================

@app.get(
    "/recommendations",
    response_model=RecommendationResponse,
    tags=["Recommendations"]
)
def recommendations():

    recommender = RecommendationEngine(DATA_FOLDER)

    result = recommender.generate()

    return RecommendationResponse(
        timestamp=get_timestamp(),
        recommendations={
            "overall_risk": result["Overall Risk"],
            "recommendations": result["Recommendations"]
        }
    )


# ==========================================================
# COMPLETE REPORT
# ==========================================================

@app.get(
    "/report",
    response_model=CompleteReportResponse,
    tags=["Complete Report"]
)
def report():

    predictor = InjuryPredictor(DATA_FOLDER)
    scorer = RiskScoringEngine(DATA_FOLDER)
    detector = MovementAnomalyDetector(DATA_FOLDER)
    recommender = RecommendationEngine(DATA_FOLDER)

    prediction = predictor.predict()
    risk = scorer.generate_report()
    anomaly = detector.analyze()
    recommendation = recommender.generate()

    return CompleteReportResponse(

        timestamp=get_timestamp(),

        predictions={
            "acl_risk": prediction["ACL Risk"],
            "hamstring_risk": prediction["Hamstring Risk"],
            "shoulder_risk": prediction["Shoulder Risk"],
            "gait_symmetry": prediction["Gait Symmetry"]
        },

        risk_report={
            "overall_score": risk["Overall Score"],
            "overall_risk": risk["Overall Risk"]
        },

        anomalies={
            "knee": anomaly["Knee"],
            "hip": anomaly["Hip"],
            "shoulder": anomaly["Shoulder"],
            "gait": anomaly["Gait"]
        },

        recommendations={
            "overall_risk": recommendation["Overall Risk"],
            "recommendations": recommendation["Recommendations"]
        }
    )