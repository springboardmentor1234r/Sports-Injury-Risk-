import os
from dotenv import load_dotenv

# Load .env file if it exists
load_dotenv()

class Settings:
    PROJECT_NAME: str = "Athlete Performance Hub API"
    VERSION: str = "1.0.0"
    
    # JWT Settings
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "super_secret_athlete_performance_key_123456789")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) # 24 hours
    
    # Database Settings
    # Supports PostgreSQL by default. If DATABASE_URL is not provided or fails, we can fallback to SQLite
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/athlete_hub")

settings = Settings()
