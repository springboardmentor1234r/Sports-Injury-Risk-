from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routes.auth_routes import router as auth_router
from routes.athelete_routes import router as athlete_router


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

@app.get("/")
def root():
    return {"message": "Sports Injury Platform API is running"}