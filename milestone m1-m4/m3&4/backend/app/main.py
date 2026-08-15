from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.requests import Request
import logging
import time
import os

from app.config import settings
from app.database import engine, Base
from app.routers import auth, athlete, injury, training, video, dataset, report, admin, intelligence

# Ensure target database tables exist.
# SQLAlchemy will create tables defined in models.py if they do not exist.
try:
    Base.metadata.create_all(bind=engine)
    # Automatically run migrations to check and append missing columns for Phase 2
    from app.database import migrate_db
    migrate_db()
except Exception as e:
    print(f"Error creating database tables: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack portal for managing athlete performance tracking, injuries logs, and pose estimation dataset pipelines.",
    version=settings.VERSION
)
logger = logging.getLogger(__name__)

@app.middleware("http")
async def log_request_timing(request: Request, call_next):
    started = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("Unhandled API error on %s %s", request.method, request.url.path)
        raise
    elapsed_ms = round((time.perf_counter() - started) * 1000, 1)
    if response.status_code >= 400:
        logger.warning("API %s %s returned %s in %sms", request.method, request.url.path, response.status_code, elapsed_ms)
    else:
        logger.info("API %s %s returned %s in %sms", request.method, request.url.path, response.status_code, elapsed_ms)
    response.headers["X-Process-Time-Ms"] = str(elapsed_ms)
    return response

# Configure CORS Middleware
# Allows the React development server to interact with the backend API
origins = [
    "http://localhost:3000",
    "http://localhost:5173", # Vite default port
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serves static uploaded files (allows direct HTML5 video playback)
uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Register API Routers
app.include_router(auth.router)
app.include_router(athlete.router)
app.include_router(injury.router)
app.include_router(training.router)
app.include_router(video.router)
app.include_router(dataset.router)
app.include_router(report.router)
app.include_router(admin.router)
app.include_router(intelligence.router)

# Basic Health Check
@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": engine.name
    }
