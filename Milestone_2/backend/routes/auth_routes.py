from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import RegisterRequest, LoginRequest, TokenResponse
from auth import hash_password, verify_password, create_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
 
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        name=data.name,
        email=data.email,
        password=hash_password(data.password),
        role=data.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Registration successful", "user_id": new_user.id}

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token({"user_id": user.id, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role
    }