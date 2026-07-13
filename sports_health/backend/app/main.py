import sys
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

backend_root = Path(__file__).resolve().parent.parent
load_dotenv(backend_root / ".env")
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from app.api.v1.auth import router as auth_router
from app.api.v1.athletes import router as athlete_router
from app.db.session import init_db
from app.api.v1.analysis import router as analysis_router

app = FastAPI(title="Sports Injury Risk Detection API")

# Setup CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, change to your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Sports Injury Risk Detection API is running"}
@app.on_event("startup")
async def start_db():
    try:
        await init_db()
        print("Successfully connected to MongoDB Atlas")
    except Exception as e:
        print(f"FAILED to connect to MongoDB: {e}")
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(athlete_router, prefix="/api/v1/athletes", tags=["athletes"])
app.include_router(analysis_router, prefix="/api/v1/analysis", tags=["analysis"])
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)