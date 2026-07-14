import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/sports_injury")

# Async Motor Client
client = AsyncIOMotorClient(MONGODB_URL)
db_name = MONGODB_URL.split("/")[-1].split("?")[0] or "sports_injury"
db = client[db_name]

def get_db():
    return db

async def init_db():
    # Unique index for user email
    await db.users.create_index("email", unique=True)
    # Indexes for videos queries
    await db.videos.create_index("athlete_id")
    await db.videos.create_index("status")

