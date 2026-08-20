from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from models.athlete import Athlete
from routes.athlete_routes import router as athlete_router
from routes.auth_routes import router as auth_router
from routes.video_routes import router as video_router
from routes.dashboard_routes import router as dashboard_router
from routes.admin_routes import router as admin_router

# Get backend directory
BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(
    title="Sports Injury Risk Detection API",
    description="Backend API for the Infosys Springboard Virtual Internship project.",
    version="1.0.0"
)

# Serve uploaded videos and reports
app.mount(
    "/uploads",
    StaticFiles(directory=str(BASE_DIR / "uploads")),
    name="uploads"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(athlete_router)
app.include_router(auth_router)
app.include_router(video_router)
app.include_router(dashboard_router)
app.include_router(admin_router)


@app.get("/")
def home():
    return {
        "message": "Welcome to the Sports Injury Risk Detection API",
        "status": "Backend is running successfully"
    }


@app.get("/about")
def about():
    return {
        "project": "Sports Injury Risk Detection from Video",
        "intern": "Sejal Chintala",
        "milestone": "Milestone 3",
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