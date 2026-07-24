import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import Base, engine
from app.routers import auth, athletes, pose

# Create tables on startup (fine for dev; use Alembic migrations in production)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sports Injury Risk Detection Platform API",
    description="Milestone 1: Auth, RBAC, Athlete Profiles. Milestone 2: Pose Estimation & Biomechanics.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(athletes.router)
app.include_router(pose.router)

# Serve annotated pose images so the frontend can display them directly
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "sports-injury-platform-api"}
