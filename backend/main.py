from fastapi import FastAPI
from models.athlete import Athlete
from routes.athlete_routes import router as athlete_router
from routes.auth_routes import router as auth_router
from routes.video_routes import router as video_router

app = FastAPI(
    title="Sports Injury Risk Detection API",
    description="Backend API for the Infosys Springboard Virtual Internship project.",
    version="1.0.0"
)
app.include_router(athlete_router)
app.include_router(auth_router)
app.include_router(video_router)

@app.get("/")
def home():
    return {
        "message": "Welcome to the Sports Injury Risk Detection API",
        "status": "Backend is running successfully"
    }


@app.get("/about")
def about():
    return {
        "project": "Sports Injury Risk Detection from Video",
        "intern": "Sejal Chintala",
        "milestone": "Milestone 1",
        "backend": "FastAPI"
    }

@app.get("/health")
def health():
    return {
        "status": "Healthy",
        "server": "Running",
        "backend": "FastAPI"
    }



