"""
config.py
---------
Central place where we read settings from the .env file.
Nothing else in the app should read environment variables directly —
they should all come through this `settings` object.
"""

import os
from dotenv import load_dotenv

# Load variables from the .env file into the environment
load_dotenv()


class Settings:
    # Database connection string, e.g.:
    # postgresql://username:password@localhost:5432/sports_injury_db
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # Secret key used to sign JWT tokens. NEVER commit the real value to git.
    SECRET_KEY: str = os.getenv("SECRET_KEY", "changeme")

    # JWT algorithm
    ALGORITHM: str = "HS256"

    # How long a login token stays valid, in minutes
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Comma-separated list of additional allowed frontend origins for CORS
    # (e.g. "https://sports-injury-frontend.onrender.com" in production).
    # localhost:5173 is always allowed in addition to this, so local
    # development never needs this variable set at all.
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "")


settings = Settings()
