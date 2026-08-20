from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import lifespan
from app.routers import auth, athletes
from app.milestone2.routers import video as milestone2_video
from app.milestone2.routers import pose as milestone2_pose
from app.milestone2.routers import analysis as milestone2_analysis
import os

# Initialize FastAPI application with Title and lifespan hooks
app = FastAPI(
    title="Sports Injury Risk Detection API",
    description="Backend service for Sports Injury Risk Detection from Video. Handles Authentication and Profile management.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS (Cross-Origin Resource Sharing)
# Allowing standard Vite React dev ports
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure folders exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("static/photos", exist_ok=True)

# Include Routers
app.include_router(auth.router)
app.include_router(athletes.router)
app.include_router(milestone2_video.router)
app.include_router(milestone2_pose.router)
app.include_router(milestone2_analysis.router)

# Mount Static Files (for photo uploads)
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Sports Injury Risk Detection API is active. Go to /docs for Swagger documentation."
    }
