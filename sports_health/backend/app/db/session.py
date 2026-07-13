# Database session placeholder
import logging
import os
from pathlib import Path    
from beanie import init_beanie
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.video import VideoMetadata
from app.models.analysis import AnalysisResult
from app.models.user import AthleteProfile, User

logger = logging.getLogger(__name__)

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


async def init_db():
    mongo_url = os.getenv("MONGODB_URL")
    if not mongo_url:
        logger.error("MONGODB_URL is not set; cannot initialize database")
        raise RuntimeError("MONGODB_URL is not configured")

    try:
        await init_beanie(connection_string=mongo_url, document_models=[User, AthleteProfile,VideoMetadata, 
            AnalysisResult])
        logger.info("Database initialized successfully")
    except Exception as exc:
        logger.warning("Database initialization skipped: %s", exc)