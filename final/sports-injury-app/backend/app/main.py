"""
main.py
--------
Entry point for the FastAPI application. Run it with:
    uvicorn app.main:app --reload

Then open http://127.0.0.1:8000/docs to see the interactive API docs.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, athletes, injuries, performance, assessments, training_load, videos, risk_assessments, analytics, reports

# NOTE: table creation is now handled by Alembic migrations (see /alembic and
# alembic.ini), not by Base.metadata.create_all(). Run `alembic upgrade head`
# before starting the server. This is the production-correct approach: every
# schema change is a reviewable, versioned migration file instead of a silent
# "create tables if missing" side effect at boot.

app = FastAPI(
    title="Sports Injury Risk Detection API",
    description="Milestone 4: Full platform -- Auth, Athlete Records, Pose Estimation, Biomechanical Analysis, Injury Risk Scoring, Team Analytics, and Reports",
    version="1.0.0",
)

# Allows our React frontend (running on a different port) to call this API.
app.add_middleware(
    CORSMiddleware,
    # Reads a comma-separated list from CORS_ORIGINS if set (e.g. your Render
    # frontend URL in production), always including localhost:5173 (Vite's
    # default dev server) so local development keeps working unchanged. A
    # hardcoded localhost-only origin list was fine for local dev but would
    # silently block the real deployed frontend's requests once this app is
    # actually running somewhere other than one developer's machine.
    allow_origins=list({"http://localhost:5173", *[o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]}),
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
app.include_router(risk_assessments.router)
app.include_router(analytics.router)
app.include_router(reports.router)


@app.get("/")
def health_check():
    return {"status": "ok", "message": "Sports Injury Risk Detection API is running"}
