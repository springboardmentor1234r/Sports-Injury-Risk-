import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base
from routes.auth_routes import router as auth_router
from routes.athelete_routes import router as athlete_router
from routes.video_routes import router as video_router
from routes.staff_routes import router as staff_router
from routes.admin_routes import router as admin_router
import models  # noqa: F401 — importing this registers Video/PoseFrame/BiomechanicsReport with Base


Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sports Injury Platform", version="1.0.0")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(athlete_router)
app.include_router(video_router)
app.include_router(staff_router)
app.include_router(admin_router)

# Serves uploaded videos so <video src="http://localhost:8000/uploads/videos/..."> works
os.makedirs("uploads/videos", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def root():
    return {"message": "Sports Injury Platform API is running"}