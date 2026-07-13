from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session

from database import SessionLocal
from models.login import UserLogin
from models.user_db import User

router = APIRouter()

@router.post("/login")
def login(user: UserLogin):
    db: Session = SessionLocal()

    db_user = db.query(User).filter(
        User.email == user.email,
        User.password == user.password
    ).first()

    db.close()

    if db_user:
        return {
            "message": "Login Successful",
            "user": db_user.username,
        }

    raise HTTPException(status_code=401, detail="Invalid email or password")