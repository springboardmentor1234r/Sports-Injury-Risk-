from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.config import settings
from app.database import engine, Base
from app.routers import auth, athlete, injury, training, video, dataset

# Ensure target database tables exist.
# SQLAlchemy will create tables defined in models.py if they do not exist.
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Error creating database tables: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack portal for managing athlete performance tracking, injuries logs, and pose estimation dataset pipelines.",
    version=settings.VERSION
)

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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router)
app.include_router(athlete.router)
app.include_router(injury.router)
app.include_router(training.router)
app.include_router(video.router)
app.include_router(dataset.router)

# Basic Health Check
@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": engine.name
    }
