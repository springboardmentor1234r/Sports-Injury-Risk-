from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sports Injury Risk Detection"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = "supersecretkey" # Change in production
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    DATABASE_URL: str = "postgresql+asyncpg://postgres:1234554321@localhost:5432/sports_injury"
    # Comma-separated list of allowed CORS origins (do not use '*' when using credentials)
    # Include common dev origins (Vite 5173, Create React 3000). Adjust in production via .env
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
    
    class Config:
        env_file = ".env"

settings = Settings()
