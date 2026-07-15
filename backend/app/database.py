from contextlib import asynccontextmanager
from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

def get_db():
    """
    Dependency function to get the MongoDB database instance.
    """
    if db_instance.db is None:
        raise RuntimeError("Database connection not initialized")
    return db_instance.db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB
    print(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
    db_instance.client = AsyncIOMotorClient(settings.MONGODB_URI)
    db_instance.db = db_instance.client[settings.DB_NAME]
    
    # Try a quick ping to verify connection
    try:
        await db_instance.client.admin.command('ping')
        print("Connected to MongoDB successfully!")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        
    yield
    
    # Shutdown: Close MongoDB client connection
    if db_instance.client:
        db_instance.client.close()
        print("Closed MongoDB connection.")
