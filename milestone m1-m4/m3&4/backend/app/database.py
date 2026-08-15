import logging
from sqlalchemy import create_engine, inspect, text
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

def migrate_db():
    """
    Automated migration helper: Inspects tables and dynamically runs ALTER TABLE queries
    to append new columns on older database schemas.
    """
    global engine
    if engine is None:
        return
        
    try:
        inspector = inspect(engine)
        
        # 1. users table migrations
        if "users" in inspector.get_table_names():
            columns = [c["name"] for c in inspector.get_columns("users")]
            with engine.begin() as conn:
                if "is_verified" not in columns:
                    logger.info("Migrating: Adding users.is_verified column...")
                    conn.execute(text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0"))
                if "verification_token" not in columns:
                    logger.info("Migrating: Adding users.verification_token column...")
                    conn.execute(text("ALTER TABLE users ADD COLUMN verification_token VARCHAR(255) NULL"))
                if "reset_token" not in columns:
                    logger.info("Migrating: Adding users.reset_token column...")
                    conn.execute(text("ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL"))
                if "refresh_token" not in columns:
                    logger.info("Migrating: Adding users.refresh_token column...")
                    conn.execute(text("ALTER TABLE users ADD COLUMN refresh_token VARCHAR(255) NULL"))
                if "last_login" not in columns:
                    logger.info("Migrating: Adding users.last_login column...")
                    conn.execute(text("ALTER TABLE users ADD COLUMN last_login DATETIME NULL"))

        # 2. videos table migrations
        if "videos" in inspector.get_table_names():
            columns = [c["name"] for c in inspector.get_columns("videos")]
            with engine.begin() as conn:
                if "skeletal_data" not in columns:
                    logger.info("Migrating: Adding videos.skeletal_data column...")
                    conn.execute(text("ALTER TABLE videos ADD COLUMN skeletal_data TEXT NULL"))
                if "movement_score" not in columns:
                    logger.info("Migrating: Adding videos.movement_score column...")
                    conn.execute(text("ALTER TABLE videos ADD COLUMN movement_score FLOAT NULL"))
                if "analysis_summary" not in columns:
                    logger.info("Migrating: Adding videos.analysis_summary column...")
                    conn.execute(text("ALTER TABLE videos ADD COLUMN analysis_summary TEXT NULL"))
                    
        logger.info("Database schema migration verification completed.")
    except Exception as e:
        logger.error(f"Migration run encountered an error: {e}")

initialize_engine()
Base = declarative_base()

# Dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
