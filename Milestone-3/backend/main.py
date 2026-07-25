from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routes.auth_routes import router as auth_router
from routes.athlete_routes import router as athlete_router
from routes.video_routes import router as video_router
from routes.dashboard_routes import router as dashboard_router

# Backend directory
BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(
    title="Sports Injury Risk Detection API",
    description="Backend API for Milestone 3 - AI Injury Prediction and Athlete Intelligence",
    version="3.0.0"
)

# Serve uploaded videos and generated reports
app.mount(
    "/uploads",
    StaticFiles(directory=str(BASE_DIR / "uploads")),
    name="uploads"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routes
app.include_router(auth_router)
app.include_router(athlete_router)
app.include_router(video_router)
app.include_router(dashboard_router)


@app.get("/")
def home():
    return {
        "message": "Welcome to the Sports Injury Risk Detection API",
        "milestone": "Milestone 3",
        "status": "Backend is running successfully"
    }


@app.get("/about")
def about():
    return {
        "project": "Sports Injury Risk Detection from Video",
        "module": "Milestone 3",
        "features": [
            "Authentication",
            "Athlete Management",
            "Video Upload",
            "Pose Detection",
            "Joint Angle Analysis",
            "AI Injury Prediction",
            "Risk Scoring",
            "Movement Anomaly Detection",
            "Recommendations",
            "Dashboard Analytics",
            "PDF Report Generation"
        ],
        "backend": "FastAPI",
        "status": "Completed"
    }


@app.get("/health")
def health():
    return {
        "status": "Healthy",
        "server": "Running",
        "backend": "FastAPI"
    }