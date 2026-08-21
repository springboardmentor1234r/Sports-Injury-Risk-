from fastapi import APIRouter

router = APIRouter()

@router.get("/dashboard")
def get_dashboard():

    return {

        "total_athletes": 125,

        "videos_analyzed": 248,

        "high_risk_cases": 15,

        "accuracy": 96,

        "backend_status": "Backend API Ready",

        "features": [

            "Joint Angle Analysis",

            "Movement Quality Analysis",

            "Injury Risk Prediction",

            "Movement Anomaly Detection",

            "Risk Scoring",

            "Corrective Recommendations"

        ]

    }