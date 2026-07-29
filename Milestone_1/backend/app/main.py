from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.database import connection
from app.routers import auth, athlete, injury, video

app = FastAPI(
    title="Sports Injury Risk Detection API"
)

# -------------------------------------------------
# Create uploads folder if it doesn't exist
# -------------------------------------------------
os.makedirs("uploads", exist_ok=True)

# -------------------------------------------------
# Serve uploaded videos and processed videos
# Example:
# http://127.0.0.1:8000/uploads/videos/sample.mp4
# http://127.0.0.1:8000/uploads/processed/processed_sample.mp4
# -------------------------------------------------
app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)

# -------------------------------------------------
# CORS
# -------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------
# API Routers
# -------------------------------------------------
app.include_router(auth.router)
app.include_router(athlete.router)
app.include_router(injury.router)
app.include_router(video.router)

# -------------------------------------------------
# Home Route
# -------------------------------------------------
@app.get("/")
def home():
    return {
        "message": "Sports Injury Risk Detection API is Running"
    }