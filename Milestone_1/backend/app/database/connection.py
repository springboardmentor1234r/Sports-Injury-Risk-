import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.database.base import Base
from app.models.user import User
from app.models.athlete_profile import AthleteProfile
from app.models.injury_report import InjuryReport
from app.models.video import Video

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base.metadata.create_all(bind=engine)
try:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
        print("✅ Connected to PostgreSQL Successfully!")
except Exception as e:
    print("❌ Database Connection Failed")
    print(e)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()