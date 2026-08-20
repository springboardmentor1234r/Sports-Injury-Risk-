from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.database import get_db
from app.schemas.user import UserRegister, UserLogin, UserOut, Token, UserUpdate
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
        created_at=current_user.get("created_at", datetime.now(timezone.utc))
    )

@router.put("/me", response_model=UserOut)
async def update_me(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Update profile details (name, email, password) for the currently authenticated user.
    Enforces that users can only edit their own profile.
    """
    user_id = current_user["_id"]
    update_data = {}
    
    if user_update.name is not None and user_update.name.strip():
        update_data["name"] = user_update.name.strip()
        
    if user_update.email is not None:
        new_email = user_update.email.lower().strip()
        if new_email != current_user["email"]:
            # Check for email collision
            existing = await db["users"].find_one({"email": new_email, "_id": {"$ne": user_id}})
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An account with this email address already exists."
                )
            update_data["email"] = new_email
            
    if user_update.password is not None and user_update.password.strip():
        update_data["password"] = hash_password(user_update.password.strip())
        
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No changes submitted for update."
        )
        
    await db["users"].update_one(
        {"_id": user_id},
        {"$set": update_data}
    )
    
    # If coach name changed, sync coach_name on athlete records created by them
    if current_user.get("role") == "Coach" and "name" in update_data:
        await db["athletes"].update_many(
            {"created_by": current_user["email"]},
            {"$set": {"coach_name": update_data["name"]}}
        )
        
    updated_user = await db["users"].find_one({"_id": user_id})
    return UserOut(
        _id=str(updated_user["_id"]),
        name=updated_user["name"],
        email=updated_user["email"],
        role=updated_user["role"],
        created_at=updated_user.get("created_at", datetime.now(timezone.utc))
    )
