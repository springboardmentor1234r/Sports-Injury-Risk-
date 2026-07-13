from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.schemas.user_schema import (
    UserCreate,
    UserResponse,
    UserLogin,
    Token,
)
from app.utils.dependencies import get_current_user
from app.utils.jwt_handler import create_access_token
from app.utils.security import (
    hash_password,
    verify_password,
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.get("/")
def auth_home():
    return {
        "message": "Authentication Router Working!"
    }


@router.post("/register", response_model=UserResponse)
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = hash_password(user.password)

    print("====================================")
    print("REGISTER")
    print("Email:", user.email)
    print("Plain Password:", user.password)
    print("Hashed Password:", hashed_password)
    print("====================================")

    new_user = User(
        username=user.username,
        email=user.email,
        password=hashed_password,
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=Token)
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    db_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not db_user:
        print("User not found:", user.email)
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    print("====================================")
    print("LOGIN")
    print("Email:", user.email)
    print("Entered Password:", user.password)
    print("Stored Hash:", db_user.password)

    try:
        password_match = verify_password(
            user.password,
            db_user.password
        )

        print("Password Match:", password_match)

    except Exception as e:
        print("VERIFY PASSWORD ERROR:", str(e))
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    if not password_match:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={
            "sub": db_user.email,
            "role": db_user.role
        }
    )

    print("LOGIN SUCCESS")
    print("====================================")

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/me")
def get_me(current_user=Depends(get_current_user)):
    return {
        "message": "Protected Route",
        "user": current_user
    }
    
@router.get("/debug/{email}")
def debug_user(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()

    if not user:
        return {"message": "User not found"}

    return {
        "email": user.email,
        "password_hash": user.password
    }