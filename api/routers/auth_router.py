from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from typing import Dict, Any
from api.auth.mysql_auth import create_user, get_user_by_email, get_user_roles, assign_role
from api.auth.password_utils import hash_password, verify_password, validate_password
from api.auth.jwt_handler import create_access_token
from api.dependencies import get_current_user
import random
from api.utils.email_utils import send_signup_otp, send_forgot_password_otp, send_password_changed_success, send_welcome_email
from api.utils.redis_utils import store_otp, verify_otp

router = APIRouter(prefix="/api/auth", tags=["auth"])

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    otp: str
    role: str = "athlete"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class EmailRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

@router.post("/send-signup-otp", status_code=status.HTTP_200_OK)
def send_signup_otp_route(req: EmailRequest):
    # Check if user already exists
    existing_user = get_user_by_email(req.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    otp = str(random.randint(1000, 9999))
    if store_otp(req.email, otp, prefix="signup_otp"):
        if send_signup_otp(req.email, otp):
            return {"message": "OTP sent successfully"}
    
    raise HTTPException(status_code=500, detail="Failed to send OTP")

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(user: UserRegister):
    # Check if user exists
    existing_user = get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Verify OTP
    if not verify_otp(user.email, user.otp, prefix="signup_otp"):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    is_valid, msg = validate_password(user.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=msg)
        
    hashed_pwd = hash_password(user.password)
    user_id = create_user(user.email, hashed_pwd, user.full_name)
    
    if not user_id:
        raise HTTPException(status_code=500, detail="Failed to create user")
        
    # Assign role
    success = assign_role(user_id, user.role.lower())
    if not success:
        # Fallback to athlete if specified role is invalid
        assign_role(user_id, "athlete")
        
    # Send welcome email
    send_welcome_email(user.email, user.full_name)
        
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

@router.post("/forgot-password")
def forgot_password_route(req: EmailRequest):
    db_user = get_user_by_email(req.email)
    if not db_user:
        # We don't want to explicitly reveal if email exists, but for UX we can
        raise HTTPException(status_code=404, detail="Email not found")
        
    otp = str(random.randint(1000, 9999))
    if store_otp(req.email, otp, prefix="reset_otp"):
        if send_forgot_password_otp(req.email, otp):
            return {"message": "OTP sent successfully"}
            
    raise HTTPException(status_code=500, detail="Failed to send OTP")

@router.post("/reset-password")
def reset_password_route(req: ResetPasswordRequest):
    db_user = get_user_by_email(req.email)
    if not db_user:
        raise HTTPException(status_code=404, detail="Email not found")
        
    # Verify OTP
    if not verify_otp(req.email, req.otp, prefix="reset_otp"):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    is_valid, msg = validate_password(req.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=msg)
        
    # Update password
    from api.auth.mysql_auth import update_user_password
    hashed_pwd = hash_password(req.new_password)
    if not update_user_password(db_user["id"], hashed_pwd):
        raise HTTPException(status_code=500, detail="Failed to update password")
        
    # Send success email
    send_password_changed_success(req.email)
    
    return {"message": "Password updated successfully"}

@router.get("/me")
def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {"user": current_user}

class AccountUpdate(BaseModel):
    full_name: str
    email: EmailStr

@router.put("/account")
def update_account(account: AccountUpdate, current_user: Dict[str, Any] = Depends(get_current_user)):
    from api.auth.mysql_auth import update_user_account, get_user_by_email
    
    # Check if they are changing email and if the new email is already taken
    if account.email != current_user["email"]:
        existing_user = get_user_by_email(account.email)
        if existing_user and str(existing_user["id"]) != str(current_user["user_id"]):
            raise HTTPException(status_code=400, detail="Email is already registered by another account")
            
    success = update_user_account(current_user["user_id"], account.full_name, account.email)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update account")
        
    return {"message": "Account updated successfully"}

class PasswordUpdate(BaseModel):
    old_password: str
    new_password: str

@router.put("/password")
def update_password(passwords: PasswordUpdate, current_user: Dict[str, Any] = Depends(get_current_user)):
    from api.auth.mysql_auth import get_user_by_id, update_user_password
    from api.auth.password_utils import hash_password, verify_password
    
    db_user = get_user_by_id(current_user["user_id"])
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Verify old password
    if not verify_password(passwords.old_password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect current password")
        
    is_valid, msg = validate_password(passwords.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=msg)
        
    # Update to new password
    hashed_pwd = hash_password(passwords.new_password)
    success = update_user_password(current_user["user_id"], hashed_pwd)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update password")
        
    # Send success email
    send_password_changed_success(db_user["email"])
        
    return {"message": "Password updated successfully"}
