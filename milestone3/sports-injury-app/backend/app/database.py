"""
database.py
------------
Sets up the connection to PostgreSQL using SQLAlchemy.

- `engine`      -> the actual connection to the database
- `SessionLocal` -> a factory that creates database "sessions" (conversations
                     with the DB) for each request
- `Base`        -> the class every table model will inherit from
- `get_db`      -> a FastAPI "dependency" that hands each request its own
                     session and closes it afterward
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

engine = create_engine(settings.DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
