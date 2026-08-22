from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import athletes, auth, dashboard, notifications, reports, users, videos

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="KineticGuard API",
    description="Sports injury intelligence platform: video assessment, risk scoring, recommendations, and role-based analytics.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (auth.router, athletes.router, videos.router, dashboard.router, notifications.router, reports.router, users.router):
    app.include_router(router)


@app.get("/health", tags=["System"])
def health():
    return {"status": "ok", "service": "kineticguard-api", "version": app.version}
