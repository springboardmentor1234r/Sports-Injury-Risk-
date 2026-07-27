from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth, athletes

# Create tables on startup (fine for dev; use Alembic migrations in production)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sports Injury Risk Detection Platform API",
    description="Milestone 1: Authentication, RBAC, and Athlete Profile Management",
    version="0.1.0",
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


@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "sports-injury-platform-api"}
