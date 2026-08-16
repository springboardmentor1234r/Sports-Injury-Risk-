import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.postgres import init_postgres, get_db
from app.db.mongo import get_mongo_db
from app.models.sql_models import User, UserRole, AthleteProfile, InjuryHistory
from app.core.security import get_password_hash
from app.api.auth import router as auth_router
from app.api.athletes import router as athlete_router
from app.datasets.loader import run_all_dataset_loaders

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Sports Injury Risk Detection Platform API - Milestone 1 Foundation",
    version="1.0.0"
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows dev frontend on any port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api/v1
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(athlete_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def on_startup():
    logger.info("Initializing PostgreSQL / SQLite database tables...")
    init_postgres()
    
    # Pre-seed demo accounts for instant evaluation
    seed_demo_accounts()
    
    # Auto-run dataset loaders on startup if needed
    try:
        run_all_dataset_loaders()
    except Exception as e:
        logger.warning(f"Dataset loader auto-run notice: {e}")

def seed_demo_accounts():
    """Seed demo accounts for each role if they don't already exist."""
    db_gen = get_db()
    db = next(db_gen)
    
    demo_users = [
        {"email": "athlete@sportsmed.io", "name": "Marcus Rashford", "role": UserRole.ATHLETE},
        {"email": "coach@sportsmed.io", "name": "Coach Jurgen", "role": UserRole.COACH},
        {"email": "physio@sportsmed.io", "name": "Dr. Sarah Jenkins", "role": UserRole.PHYSIOTHERAPIST},
        {"email": "scientist@sportsmed.io", "name": "Dr. Aris Thorne", "role": UserRole.SPORTS_SCIENTIST},
        {"email": "admin@sportsmed.io", "name": "System Administrator", "role": UserRole.ADMINISTRATOR},
    ]
    
    pwd_hash = get_password_hash("password123")
    
    for demo in demo_users:
        user = db.query(User).filter(User.email == demo["email"]).first()
        if not user:
            user = User(
                full_name=demo["name"],
                email=demo["email"],
                hashed_password=pwd_hash,
                role=demo["role"]
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # If athlete, seed profile and injury history
            if demo["role"] == UserRole.ATHLETE:
                profile = AthleteProfile(
                    user_id=user.user_id,
                    athlete_id="ATH-9901",
                    sport_type="Soccer",
                    position="Winger / Forward",
                    age=26,
                    height=180.0,
                    weight=75.5,
                    training_load=1.42
                )
                db.add(profile)
                
                inj = InjuryHistory(
                    user_id=user.user_id,
                    injury_type="Left ACL Reconstruction",
                    recovery_status="Recovered",
                    date_of_injury="2024-03-15"
                )
                db.add(inj)
                db.commit()
                
    logger.info("Demo accounts verified and seeded successfully.")

@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/v1/datasets/status")
def get_datasets_status():
    """Retrieve status of loaded baseline datasets in MongoDB."""
    mongo = get_mongo_db()
    logs_col = mongo["movement_logs"]
    video_col = mongo["video_metadata"]
    
    return {
        "movement_logs_count": logs_col.count_documents({}),
        "video_metadata_count": video_col.count_documents({}),
        "datasets_available": [
            "Human3.6M (3D Joint Tracking)",
            "MPII Human Pose (Body Keypoints)",
            "COCO Keypoints (17-Keypoint Motion)",
            "SportsPose (Sports Movement Benchmarks)",
            "FIFA Injury Database (Trend Metrics)"
        ]
    }

@app.post("/api/v1/datasets/ingest")
def trigger_dataset_ingestion():
    """Trigger manual re-ingestion of baseline biomechanics datasets."""
    run_all_dataset_loaders()
    return {"status": "success", "message": "All biomechanics baseline datasets ingested."}
