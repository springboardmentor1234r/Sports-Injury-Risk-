import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URI: str = "mongodb://localhost:27017"
    DB_NAME: str = "sports_injury_db"
    JWT_SECRET: str = "c29ydHNfaW5qdXJ5X3Jpc2tfZGV0ZWN0aW9uX2F1dGhfc2VjcmV0X2tleV8yMDI2"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
