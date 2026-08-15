import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Database, seed_demo_accounts
from app.routes import auth_routes, user_routes

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect database on startup
    await Database.connect_db()
    # Seed demo users if they do not exist
    await seed_demo_accounts()
    yield
    # Close database connection on shutdown
    await Database.close_db()

app = FastAPI(
    title="SIRD - Sports Injury Risk Detection API",
    description="Backend API services for user auth and sports injury analytics",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173", # standard fallback
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_routes.router)
app.include_router(user_routes.router)

@app.get("/")
async def root():
    return {
        "app": "SIRD (Sports Injury Risk Detection)",
        "status": "online",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
