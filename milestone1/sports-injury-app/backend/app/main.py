"""
main.py
--------
Entry point for the FastAPI application. Run it with:
    uvicorn app.main:app --reload

Then open http://127.0.0.1:8000/docs to see the interactive API docs.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth, athletes

# Creates all tables defined in models.py if they don't exist yet.
# (Fine for Milestone 1. In later milestones we'll switch to Alembic
# migrations so schema changes are tracked properly.)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sports Injury Risk Detection API",
    description="Milestone 1: Auth + Athlete Profile Management",
    version="0.1.0",
)

# Allows our React frontend (running on a different port) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite's default dev server port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(athletes.router)


@app.get("/")
def health_check():
    return {"status": "ok", "message": "Sports Injury Risk Detection API is running"}
