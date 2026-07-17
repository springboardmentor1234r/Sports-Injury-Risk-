from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from typing import Dict, Any
from api.auth.mysql_auth import create_user, get_user_by_email, get_user_roles, assign_role
from api.auth.password_utils import hash_password, verify_password
from api.auth.jwt_handler import create_access_token
from api.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "athlete"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(user: UserRegister):
    # Check if user exists
    existing_user = get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_pwd = hash_password(user.password)
    user_id = create_user(user.email, hashed_pwd, user.full_name)
    
    if not user_id:
        raise HTTPException(status_code=500, detail="Failed to create user")
        
    # Assign role
    success = assign_role(user_id, user.role.lower())
    if not success:
        # Fallback to athlete if specified role is invalid
        assign_role(user_id, "athlete")
        
    return {"message": "User created successfully", "user_id": user_id}

@router.post("/login")
def login_user(user: UserLogin):
    db_user = get_user_by_email(user.email)
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    if not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    if not db_user["is_active"]:
        raise HTTPException(status_code=403, detail="User account is disabled")
        
    roles = get_user_roles(db_user["id"])
    
    # Generate token
    token_data = {
        "sub": str(db_user["id"]),
        "email": db_user["email"],
        "roles": roles
    }
    
    token = create_access_token(token_data)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": db_user["id"],
            "email": db_user["email"],
            "full_name": db_user["full_name"],
            "roles": roles
        }
    }

@router.get("/me")
def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {"user": current_user}
