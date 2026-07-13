from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import connection
from app.routers import auth, athlete, injury, video

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(athlete.router)
app.include_router(injury.router)
app.include_router(video.router)


@app.get("/")
def home():
    return {
        "message": "Sports Injury Risk Detection API is Running"
    }