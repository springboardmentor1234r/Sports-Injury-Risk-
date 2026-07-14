from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import UserDoc
from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    db = get_db()
    
    # Check email uniqueness
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user document
    hashed_password = get_password_hash(user_data.password)
    user_doc = UserDoc(
        email=user_data.email,
        hashed_password=hashed_password,
        role=user_data.role
    )
    
    try:
        await db.users.insert_one(user_doc.model_dump())
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    return user_doc

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    db = get_db()
    user_dict = await db.users.find_one({"email": credentials.email})
    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
        
    user = UserDoc(**user_dict)
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
        
    access_token = create_access_token(subject=user.id, role=user.role)
    return Token(access_token=access_token)

from app.services.auth_service import get_current_user
from app.core.permissions import allow_admin

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserDoc = Depends(get_current_user)):
    return current_user

@router.get("/admin/test")
async def admin_test(admin_user: UserDoc = Depends(allow_admin)):
    return {"message": "admin test ok", "user_id": admin_user.id}

