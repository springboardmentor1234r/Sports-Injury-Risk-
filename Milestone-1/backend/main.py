from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.auth_routes import router as auth_router
from routes.athlete_routes import router as athlete_router

app = FastAPI(
    title="Sports Injury Risk Detection API",
    description="Backend API for Milestone 1 - Authentication and Athlete Management",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routes
app.include_router(auth_router)
app.include_router(athlete_router)


@app.get("/")
def home():
    return {
        "message": "Welcome to the Sports Injury Risk Detection API",
        "milestone": "Milestone 1",
        "status": "Backend is running successfully"
    }


@app.get("/about")
def about():
    return {
        "project": "Sports Injury Risk Detection from Video",
        "module": "Milestone 1",
        "features": [
            "Authentication",
            "Athlete Management",
            "Backend Setup"
        ],
        "backend": "FastAPI"
    }


@app.get("/health")
def health():
    return {
        "status": "Healthy",
        "server": "Running",
        "backend": "FastAPI"
    }