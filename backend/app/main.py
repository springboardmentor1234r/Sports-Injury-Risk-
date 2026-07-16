from fastapi import FastAPI

from app.database.database import Base, engine

# Import API Routers
from app.api.auth import router as auth_router
from app.api.athlete import router as athlete_router
from app.api.video import router as video_router
from app.api.pose import router as pose_router
from app.api.trajectory import router as trajectory_router   # 
from app.api.angle import router as angle_router
from app.api.rom import router as rom_router
from app.api.symmetry import router as symmetry_router
from app.api.posture import router as posture_router

# Import Models
from app.models.user import User
from app.models.athlete import Athlete
from app.models.video import Video

# Create Database Tables
Base.metadata.create_all(bind=engine)

# Create FastAPI Application
app = FastAPI(
    title="Sports Injury Risk Detection API",
    version="0.1.0",
    description="AI-powered Sports Injury Risk Detection from Video using FastAPI and MediaPipe"
)

# Include Routers
app.include_router(auth_router)
app.include_router(athlete_router)
app.include_router(video_router)
app.include_router(pose_router)
app.include_router(trajectory_router) 
app.include_router(angle_router)  # NEW
app.include_router(rom_router)  # NEW
app.include_router(symmetry_router)
app.include_router(posture_router)

@app.get("/")
def home():
    return {
        "message": "Sports Injury Risk Detection API",
        "status": "Database Connected Successfully!",
        "version": "0.1.0"
    }