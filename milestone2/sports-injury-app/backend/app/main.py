"""
main.py
--------
Entry point for the FastAPI application. Run it with:
    uvicorn app.main:app --reload

Then open http://127.0.0.1:8000/docs to see the interactive API docs.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, athletes, injuries, performance, assessments, training_load, videos

# NOTE: table creation is now handled by Alembic migrations (see /alembic and
# alembic.ini), not by Base.metadata.create_all(). Run `alembic upgrade head`
# before starting the server. This is the production-correct approach: every
# schema change is a reviewable, versioned migration file instead of a silent
# "create tables if missing" side effect at boot.

app = FastAPI(
    title="Sports Injury Risk Detection API",
    description="Milestone 2: Auth, Athlete Profile Management, and Pose Estimation / Biomechanical Analysis",
    version="0.3.0",
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
app.include_router(injuries.router)
app.include_router(performance.router)
app.include_router(assessments.router)
app.include_router(training_load.router)
app.include_router(videos.router)


@app.get("/")
def health_check():
    return {"status": "ok", "message": "Sports Injury Risk Detection API is running"}
