from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import auth as auth_router
from .routers import athletes as athletes_router

# Create DB tables on startup (fine for dev / SQLite; use Alembic migrations for production)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sports Injury Risk Detection Platform API",
    description="Milestone 1: Auth, RBAC, and Athlete Profile Management",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(athletes_router.router)


@app.get("/")
def root():
    return {"status": "ok", "message": "Sports Injury Risk Detection API is running"}
