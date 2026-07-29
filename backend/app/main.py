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
# Create upload folders
# -------------------------------------------------

os.makedirs("uploads/videos", exist_ok=True)
os.makedirs("uploads/processed", exist_ok=True)

# -------------------------------------------------
# Static Files
# -------------------------------------------------

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)

# Optional
app.mount(
    "/processed",
    StaticFiles(directory="uploads/processed"),
    name="processed"
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
# Routers
# -------------------------------------------------

app.include_router(auth.router)
app.include_router(athlete.router)
app.include_router(injury.router)
app.include_router(video.router)

# -------------------------------------------------
# Home
# -------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "Sports Injury Risk Detection API is Running"
    }