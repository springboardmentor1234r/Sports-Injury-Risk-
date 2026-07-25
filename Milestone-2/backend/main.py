from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routes.auth_routes import router as auth_router
from routes.athlete_routes import router as athlete_router
from routes.video_routes import router as video_router

# Backend directory
BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(
    title="Sports Injury Risk Detection API",
    description="Backend API for Milestone 2 - Pose Estimation and Biomechanical Analysis",
    version="2.0.0"
)

# Serve uploaded videos
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


@app.get("/")
def home():
    return {
        "message": "Welcome to the Sports Injury Risk Detection API",
        "milestone": "Milestone 2",
        "status": "Backend is running successfully"
    }


@app.get("/about")
def about():
    return {
        "project": "Sports Injury Risk Detection from Video",
        "module": "Milestone 2",
        "features": [
            "Authentication",
            "Athlete Management",
            "Video Upload",
            "Pose Detection",
            "Joint Angle Analysis"
        ],
        "backend": "FastAPI"
    }


@app.get("/health")
def health():
    return {
        "status": "Healthy",
        "server": "Running",
        "backend": "FastAPI"
    }