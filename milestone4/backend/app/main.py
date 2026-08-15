import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Database, seed_demo_accounts
import os
from fastapi.staticfiles import StaticFiles
from app.routes import (
    auth_routes, user_routes, video_routes,
    prediction_routes, recommendation_routes,
    notification_routes, report_routes, system_routes
)
from app.engines.ml_prediction_engine import MLPredictionEngine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure storage paths exist
    os.makedirs("storage/processed", exist_ok=True)
    # Connect database on startup
    await Database.connect_db()
    # Seed demo users if they do not exist
    await seed_demo_accounts()
    # Load ML models
    MLPredictionEngine.load_models()
    yield
    # Close database connection on shutdown
    await Database.close_db()

app = FastAPI(
    title="SIRD - Sports Injury Risk Detection API (Milestone 4)",
    description="Production-ready backend API for biomechanics, ML predictions, reports & notifications",
    version="3.0.0",
    lifespan=lifespan
)

# Mount storage static files
app.mount("/storage", StaticFiles(directory="storage"), name="storage")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_routes.router)
app.include_router(user_routes.router)
app.include_router(video_routes.router)
app.include_router(prediction_routes.router)
app.include_router(recommendation_routes.router)
app.include_router(notification_routes.router)
app.include_router(report_routes.router)
app.include_router(system_routes.router)



@app.get("/")
async def root():
    return {
        "app": "SIRD (Sports Injury Risk Detection)",
        "status": "online",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
