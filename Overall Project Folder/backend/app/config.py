import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Athletiq AI"
    PROJECT_SLOGAN: str = "AI-Powered Sports Injury Intelligence"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "athletiq_ai_super_secret_jwt_key_2026_sports_injury_protection")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "athletiq_ai_db")
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    REPORTS_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "reports")
    MAX_UPLOAD_SIZE_MB: int = 200

    class Config:
        case_sensitive = True

settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)
