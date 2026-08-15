import os
from dotenv import load_dotenv

# Load .env file from the root directory
base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
dotenv_path = os.path.join(base_dir, ".env")
load_dotenv(dotenv_path)

class Settings:
    MONGODB_URL: str = os.getenv("MONGODB_URL", "")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "c0fda31c14076334b731ec543c60d641192f12cefd1d31870de82b229748bf92")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    PORT: int = int(os.getenv("PORT", 8000))

    HOST: str = os.getenv("HOST", "127.0.0.1")

settings = Settings()

