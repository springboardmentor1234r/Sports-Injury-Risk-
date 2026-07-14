import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from app.database import init_db
from app.routers import auth, oauth, athlete, video

app = FastAPI(
    title="Sports Injury Risk Detection API",
    description="Backend API for detecting and analyzing sports injury risks from video feeds.",
    version="0.1.0"
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add SessionMiddleware (required by Authlib for OAuth state storage)
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("JWT_SECRET_KEY", "session-secret-fallback")
)

@app.on_event("startup")
async def startup_db_client():
    await init_db()

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(oauth.router, prefix="/api")
app.include_router(athlete.router, prefix="/api")
app.include_router(video.router, prefix="/api")

@app.get("/health")
def health_check():
    return {"status": "ok"}
