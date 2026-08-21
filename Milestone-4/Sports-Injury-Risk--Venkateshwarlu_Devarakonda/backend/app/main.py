import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.database.base import Base
from app.database.connection import engine

from app.models.user import User
from app.models.athlete_profile import AthleteProfile
from app.models.coach_profile import CoachProfile
from app.models.video import Video
from app.models.injury_report import InjuryReport
from app.models.physiotherapist_profile import PhysiotherapistProfile
from app.models.sports_scientist_profile import SportsScientistProfile

from app.routers.auth import router as auth_router
from app.routers.google_auth import router as google_auth_router
from app.routers.athlete import router as athlete_router
from app.routers.coach import router as coach_router
from app.routers.video import router as video_router
from app.routers.injury import router as injury_router
from app.routers.physiotherapist import router as physiotherapist_router
from app.routers.sports_scientist import router as sports_scientist_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables initialized.")
    except Exception as exc:
        print(f"Database initialization error: {exc}")

    print("Sports Injury Risk Detection API started.")

    yield

    print("Sports Injury Risk Detection API stopped.")


app = FastAPI(
    title="Sports Injury Risk Detection API",
    description=(
        "AI-powered Sports Injury Risk Detection Platform "
        "for athletes, coaches, physiotherapists, "
        "sports scientists and administrators."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads",
)

SESSION_SECRET = os.getenv(
    "SESSION_SECRET_KEY",
    os.getenv(
        "OAUTH_STATE_SECRET",
        "sports_injury_session_secret_2026",
    ),
)


app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET,
    max_age=60 * 60 * 24,
    same_site="lax",
    https_only=False,
)


FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173",
).strip().rstrip("/")


ALLOWED_ORIGINS = list(
    dict.fromkeys(
        [
            FRONTEND_URL,
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "Sports Injury Risk Detection API is running",
        "status": "success",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "sports-injury-risk-detection-api",
    }


@app.get("/api")
def api_info():
    return {
        "name": "Sports Injury Risk Detection API",
        "version": "1.0.0",
        "status": "running",
        "authentication": {
            "normal": "/auth/login",
            "register": "/auth/register",
            "google": "/auth/google/login",
        },
        "roles": [
            "athlete",
            "coach",
            "physiotherapist",
            "sports_scientist",
            "admin",
        ],
        "modules": {
            "athlete": "/athlete",
            "coach": "/coach",
            "physiotherapist": "/physiotherapist",
            "sports_scientist": "/sports-scientist",
            "video": "/video",
            "injury_reports": "/injury",
        },
    }


app.include_router(auth_router)
app.include_router(google_auth_router)
app.include_router(athlete_router)
app.include_router(coach_router)
app.include_router(physiotherapist_router)
app.include_router(sports_scientist_router)
app.include_router(video_router)
app.include_router(injury_router)