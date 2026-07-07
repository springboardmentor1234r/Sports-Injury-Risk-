from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, athletes

app = FastAPI(title="Sports Injury Risk Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(athletes.router)

@app.get("/")
def read_root():
    return {"message": "Sports Injury Risk Detection API is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}