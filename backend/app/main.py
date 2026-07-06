from fastapi import FastAPI

from app.database.database import Base, engine

from app.api.auth import router as auth_router
from app.api.athlete import router as athlete_router
from app.api.video import router as video_router

from app.models.user import User
from app.models.athlete import Athlete
from app.models.video import Video

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sports Injury Risk Detection API",
    version="0.1.0"
)

app.include_router(auth_router)
app.include_router(athlete_router)
app.include_router(video_router)


@app.get("/")
def home():
    return {
        "message": "Sports Injury Risk Detection API",
        "status": "Database Connected Successfully!"
    }