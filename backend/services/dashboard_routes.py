from fastapi import APIRouter

router = APIRouter()

@router.get("/dashboard")
def get_dashboard():
    return {
        "message": "Athlete Intelligence Dashboard",
        "status": "Backend API Ready",
        "features": [
            "Joint Angle Analysis",
            "Movement Quality Analysis",
            "Injury Risk Prediction",
            "Movement Anomaly Detection",
            "Risk Scoring",
            "Corrective Recommendations"
        ]
    }