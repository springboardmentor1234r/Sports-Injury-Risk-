from fastapi import FastAPI
from app.config import settings
from app.api.v1 import auth, athletes, videos
from app.middleware.cors import add_cors_middleware
from app.database import create_tables

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Enable CORS for frontend requests
add_cors_middleware(app)

@app.on_event("startup")
async def startup_event():
    await create_tables()

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(athletes.router, prefix=f"{settings.API_V1_STR}/athletes", tags=["athletes"])
app.include_router(videos.router, prefix=f"{settings.API_V1_STR}/videos", tags=["videos"])

@app.get("/")
async def root():
    return {"message": "Welcome to Sports Injury Risk Detection API"}
