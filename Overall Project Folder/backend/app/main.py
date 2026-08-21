import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import db_manager

from app.routes.auth_routes import router as auth_router
from app.routes.athlete_routes import router as athlete_router
from app.routes.video_routes import router as video_router
from app.routes.analysis_routes import router as analysis_router
from app.routes.recommendation_routes import router as recommendation_router
from app.routes.notification_routes import router as notification_router
from app.routes.report_routes import router as report_router
from app.routes.system_routes import router as system_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("athletiq_ai.main")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=f"{settings.PROJECT_SLOGAN} - Sports Injury Risk Detection & Video Biomechanics Platform API",
    version="3.0.0"
)

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for video uploads
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth_router)
app.include_router(athlete_router)
app.include_router(video_router)
app.include_router(analysis_router)
app.include_router(recommendation_router)
app.include_router(notification_router)
app.include_router(report_router)
app.include_router(system_router)

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing Athletiq AI Backend...")
    await db_manager.connect_to_database()
    
    # Auto-seed database if empty
    try:
        from app.seed_12_athletes import seed_data
        await seed_data()
    except Exception as e:
        logger.warning(f"Auto-seed notification: {e}")

@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "slogan": settings.PROJECT_SLOGAN,
        "status": "Online",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
