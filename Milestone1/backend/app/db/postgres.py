from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# For SQLite compatibility, ensure check_same_thread is False
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency to get SQLAlchemy DB session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_postgres():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
