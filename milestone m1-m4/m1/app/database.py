import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL
engine = None
SessionLocal = None

# Try establishing database connection with PostgreSQL. Fallback to SQLite if it fails or is requested.
def initialize_engine():
    global engine, SessionLocal, SQLALCHEMY_DATABASE_URL
    
    # Check if SQLite is explicitly requested or if we should attempt PostgreSQL first
    is_sqlite = SQLALCHEMY_DATABASE_URL.startswith("sqlite")
    
    if is_sqlite:
        logger.info("Initializing database using SQLite...")
        engine = create_engine(
            SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
        )
    else:
        try:
            logger.info("Attempting connection to PostgreSQL...")
            # We add a short connect timeout to fail-fast if PostgreSQL is not active
            if "?" in SQLALCHEMY_DATABASE_URL:
                conn_url = f"{SQLALCHEMY_DATABASE_URL}&connect_timeout=3"
            else:
                conn_url = f"{SQLALCHEMY_DATABASE_URL}?connect_timeout=3"
                
            engine = create_engine(conn_url)
            # Try to connect to check if the server is actually reachable
            connection = engine.connect()
            connection.close()
            logger.info("Successfully connected to PostgreSQL database!")
        except Exception as e:
            logger.warning(
                f"Failed to connect to PostgreSQL: {e}.\n"
                f"Falling back to local SQLite database 'athlete_hub.db' for developer convenience."
            )
            SQLALCHEMY_DATABASE_URL = "sqlite:///./athlete_hub.db"
            engine = create_engine(
                SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
            )

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

initialize_engine()
Base = declarative_base()

# Dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
