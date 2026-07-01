from fastapi import FastAPI

from app.database.database import Base, engine
from app.models.user import User

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sports Injury Risk Detection API"
)


@app.get("/")
def root():
    return {
        "message": "Sports Injury Risk Detection API",
        "status": "Database Connected Successfully!"
    }