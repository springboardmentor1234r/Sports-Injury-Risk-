from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.database import get_db
from app.schemas.user import UserRegister, UserLogin, UserOut, Token
from app.utils.auth import hash_password, verify_password, create_access_token, decode_access_token
from app.models.user import UserRole

router = APIRouter(tags=["Authentication"])
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Dependency to validate the JWT from the Authorization header and return the user.
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is invalid",
        )
        
    try:
        user_doc = await db["users"].find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token metadata",
        )
        
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
        
    return user_doc

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Register a new user with Name, Email, Password, and Role.
    """
    # Normalize email to lowercase
    email = user_in.email.lower().strip()
    
    # Check if duplicate email exists
    existing_user = await db["users"].find_one({"email": email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )
    
    # Hash password and create document
    hashed_pwd = hash_password(user_in.password)
    user_doc = {
        "name": user_in.name.strip(),
        "email": email,
        "password": hashed_pwd,
        "role": user_in.role.value,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db["users"].insert_one(user_doc)
    user_doc["_id"] = str(result.inserted_id)
    
    return UserOut(
        _id=user_doc["_id"],
        name=user_doc["name"],
        email=user_doc["email"],
        role=user_doc["role"],
        created_at=user_doc["created_at"]
    )

@router.post("/login", response_model=Token)
async def login(user_in: UserLogin, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Authenticate user and return a JWT access token.
    """
    email = user_in.email.lower().strip()
    
    # Search for the user in MongoDB
    user_doc = await db["users"].find_one({"email": email})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )
        
    # Verify password hash
    if not verify_password(user_in.password, user_doc["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )
        
    # Generate token payload
    token_payload = {
        "id": str(user_doc["_id"]),
        "email": user_doc["email"],
        "role": user_doc["role"]
    }
    
    # Create the token
    access_token = create_access_token(data=token_payload)
    
    return Token(
        access_token=access_token,
        token_type="bearer"
    )

@router.get("/me", response_model=UserOut)
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Retrieve details of the currently authenticated user.
    """
    return UserOut(
        _id=str(current_user["_id"]),
        name=current_user["name"],
        email=current_user["email"],
        role=current_user["role"],
        created_at=current_user["created_at"]
    )
