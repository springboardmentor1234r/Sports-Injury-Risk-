from fastapi import FastAPI
from database import engine,Base
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
#Import database models
from models.player_db import Player
from models.user_db import User
#Import routes
from routes.player_routes import router
from routes.auth import router as auth_router
from routes.login_routes import router as login_router
from routes.analysis_routes import router as analysis_router
from routes.upload_routes import router as upload_router
#create database tables
Base.metadata.create_all(bind=engine)
#create FastAPI app
app = FastAPI(title="Sports Injury Risk Detection API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
#Include routes
app.include_router(router)
app.include_router(auth_router)
app.include_router(login_router)
app.include_router(analysis_router)
app.include_router(upload_router)
frontend_path = os.path.join(
    os.path.dirname(__file__),
    "frontend"
)

app.mount("/frontend", StaticFiles(directory=frontend_path), name="frontend")
@app.get("/")
def home():
    return {"message": "Welcome to Sports Injury Risk Detection System","status":"Running Successfully"}
@app.get("/dashboard")
def dashboard():
    return FileResponse(
        os.path.join(frontend_path, "dashboard.html")
    )
@app.get("/home")
def home_page():
    return FileResponse(
        os.path.join(frontend_path, "home.html")
    )