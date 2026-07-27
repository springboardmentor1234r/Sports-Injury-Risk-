from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
import logging

logger = logging.getLogger("sird.db")

class Database:
    client: AsyncIOMotorClient = None
    db = None

    @classmethod
    async def connect_db(cls):
        if not settings.MONGODB_URL:
            logger.error("MONGODB_URL is not set!")
            raise ValueError("MONGODB_URL is missing from environment variables")
        
        logger.info("Connecting to MongoDB Atlas...")
        cls.client = AsyncIOMotorClient(settings.MONGODB_URL)
        # Verify the database exists or can be connected to
        # In motor we use get_default_database() or specify the db from URL
        # Let's extract the db name from connection URL or default to 'sports_injury'
        db_name = "sports_injury"
        try:
            # Check if there is a db name in the connection string
            # Format: ...net/db_name?authSource...
            url_part = settings.MONGODB_URL.split(".net/")
            if len(url_part) > 1:
                db_name = url_part[1].split("?")[0]
        except Exception:
            pass
            
        cls.db = cls.client[db_name]
        logger.info(f"Connected to database: {db_name}")

    @classmethod
    async def close_db(cls):
        if cls.client:
            cls.client.close()
            logger.info("MongoDB connection closed")

# Dependency helper
async def get_db():
    return Database.db

async def seed_demo_accounts():
    from app.auth import hash_password
    from datetime import datetime
    
    db = Database.db
    if db is None:
        return
        
    demo_coaches = [
        {"email": "coach.alex@sird.com", "fullname": "Alex Ferguson", "role": "Coach"},
        {"email": "coach.pep@sird.com", "fullname": "Pep Guardiola", "role": "Coach"},
        {"email": "coach.jurgen@sird.com", "fullname": "Jurgen Klopp", "role": "Coach"},
        {"email": "coach.carlo@sird.com", "fullname": "Carlo Ancelotti", "role": "Coach"},
        {"email": "coach.jose@sird.com", "fullname": "Jose Mourinho", "role": "Coach"}
    ]
    
    demo_physios = [
        {"email": "physio.john@sird.com", "fullname": "John Carter", "role": "Physiotherapist"},
        {"email": "physio.sarah@sird.com", "fullname": "Sarah Connor", "role": "Physiotherapist"},
        {"email": "physio.emma@sird.com", "fullname": "Emma Watson", "role": "Physiotherapist"},
        {"email": "physio.robert@sird.com", "fullname": "Robert Bruce", "role": "Physiotherapist"},
        {"email": "physio.alice@sird.com", "fullname": "Alice Vance", "role": "Physiotherapist"}
    ]
    
    demo_scientists = [
        {"email": "scientist.newton@sird.com", "fullname": "Newton Galileo", "role": "Sports Scientist"},
        {"email": "scientist.marie@sird.com", "fullname": "Marie Curie", "role": "Sports Scientist"}
    ]
    
    all_demos = demo_coaches + demo_physios + demo_scientists
    
    for demo in all_demos:
        existing = await db.users.find_one({"email": demo["email"]})
        if not existing:
            new_user = {
                "email": demo["email"],
                "fullname": demo["fullname"],
                "role": demo["role"],
                "password": hash_password("password123"),
                "auth_provider": "local",
                "created_at": datetime.utcnow()
            }
            await db.users.insert_one(new_user)
            logger.info(f"Seeded demo account: {demo['fullname']} ({demo['role']})")
