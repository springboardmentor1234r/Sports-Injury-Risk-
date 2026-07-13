# Authentication endpoints placeholder
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, Token
from app.core.security import get_password_hash, verify_password, create_access_token

router = APIRouter()

@router.post("/register", response_model=UserOut)
async def register(user_in: UserCreate):
    # Check if user exists
    user_exists = await User.find_one({"email": user_in.email})
    if user_exists:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create new user
    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role
    )
    await new_user.insert()
    return new_user

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await User.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(subject=user.email)
    return {"access_token": access_token, "token_type": "bearer"}