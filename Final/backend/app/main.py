from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import lifespan
import os

# Routers
from app.routers import auth, athletes
from app.milestone2.routers import video as milestone2_video
from app.milestone2.routers import pose as milestone2_pose
from app.milestone2.routers import analysis as milestone2_analysis

# Milestone 3 Routers
try:
    from app.routers import anomalies, injury_risk, risk_scores, recommendations, intelligence, pipeline
    has_m3 = True
except Exception:
    has_m3 = False

# Milestone 4 Routers
try:
    from app.routers import reports, history, notifications
    has_m4 = True
except Exception:
    has_m4 = False

app = FastAPI(
    title="KineticGuard - Sports Injury Risk Detection API",
    description="Integrated API backend service for Video Ingestion, 33-Keypoint Pose Estimation, Biomechanical Telemetry, and Injury Risk Analytics.",
    version="4.0.0",
    lifespan=lifespan
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
os.makedirs("static/photos", exist_ok=True)

# Mount Milestone 1 & 2 Routers
app.include_router(auth.router)
app.include_router(athletes.router)
app.include_router(milestone2_video.router)
app.include_router(milestone2_pose.router)
app.include_router(milestone2_analysis.router)

# Mount Milestone 3 Routers
if has_m3:
    app.include_router(anomalies.router)
    app.include_router(injury_risk.router)
    app.include_router(risk_scores.router)
    app.include_router(recommendations.router)
    app.include_router(intelligence.router)
    app.include_router(pipeline.router)

# Mount Milestone 4 Routers
if has_m4:
    app.include_router(reports.router)
    app.include_router(history.router)
    app.include_router(notifications.router)

if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")
if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
async def root():
    return {
        "status": "online",
        "system": "KineticGuard Sports Injury Risk Detection API",
        "version": "4.0.0",
        "docs": "/docs"
    }
