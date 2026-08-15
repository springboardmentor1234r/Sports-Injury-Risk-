from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr
from typing import Dict, Any
from database.sql_utils import create_user, get_user_by_email, get_user_roles, assign_role, update_user_profile_picture
from api.auth.password_utils import hash_password, verify_password, validate_password
from api.auth.jwt_handler import create_access_token
from api.dependencies import get_current_user
import random
import os
import urllib.parse
import json
import httpx
from api.config import settings
from src.worker.notification_tasks import (
    send_otp_signup_task,
    send_otp_forgot_password_task,
    send_password_changed_success_task,
    send_welcome_email_task
)
from database.redis_utils import store_otp, verify_otp
from api.utils.rate_limiter import limiter

router = APIRouter(prefix="/api/auth", tags=["auth"])
google_auth_router = APIRouter(tags=["google-auth"])

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
@limiter.limit("3/15minutes")
def send_signup_otp_route(request: Request, req: EmailRequest):
    # Check if user already exists
    existing_user = get_user_by_email(req.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    otp = str(random.randint(1000, 9999))
    if store_otp(req.email, otp, prefix="signup_otp"):
        send_otp_signup_task.apply_async(args=[req.email, otp], queue='high_priority')
        return {"message": "OTP sent successfully"}
    
    raise HTTPException(status_code=500, detail="Failed to send OTP")

@router.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register_user(request: Request, user: UserRegister):
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
        
    # Send welcome email asynchronously
    send_welcome_email_task.apply_async(args=[user.email, user.full_name], queue='default')
        
    return {"message": "User created successfully", "user_id": user_id}

@router.post("/login")
@limiter.limit("5/minute")
def login_user(request: Request, user: UserLogin):
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
    
    from database.sql_utils import get_user_by_id
    full_user = get_user_by_id(db_user["id"]) or db_user
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": full_user["id"],
            "email": full_user["email"],
            "full_name": full_user["full_name"],
            "roles": roles,
            "profile_picture_url": full_user.get("profile_picture_url"),
            "coach_code": full_user.get("coach_code")
        }
    }

@router.post("/forgot-password")
@limiter.limit("3/15minutes")
def forgot_password_route(request: Request, req: EmailRequest):
    db_user = get_user_by_email(req.email)
    if not db_user:
        # We don't want to explicitly reveal if email exists, but for UX we can
        raise HTTPException(status_code=404, detail="Email not found")
        
    otp = str(random.randint(1000, 9999))
    if store_otp(req.email, otp, prefix="reset_otp"):
        send_otp_forgot_password_task.apply_async(args=[req.email, otp], queue='high_priority')
        return {"message": "OTP sent successfully"}
            
    raise HTTPException(status_code=500, detail="Failed to send OTP")

@router.post("/reset-password")
@limiter.limit("5/minute")
def reset_password_route(request: Request, req: ResetPasswordRequest):
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
    from database.sql_utils import update_user_password
    hashed_pwd = hash_password(req.new_password)
    if not update_user_password(db_user["id"], hashed_pwd):
        raise HTTPException(status_code=500, detail="Failed to update password")
        
    # Send success email asynchronously
    send_password_changed_success_task.apply_async(args=[req.email], queue='high_priority')
    
    return {"message": "Password updated successfully"}

@router.get("/me")
def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    from database.sql_utils import get_user_by_id
    db_user = get_user_by_id(int(current_user["user_id"]))
    full_name = db_user["full_name"] if db_user else None
    profile_picture_url = db_user.get("profile_picture_url") if db_user else None
    coach_code = db_user.get("coach_code") if db_user else None
    return {
        "user": {
            **current_user,
            "full_name": full_name,
            "profile_picture_url": profile_picture_url,
            "coach_code": coach_code
        }
    }

class AccountUpdate(BaseModel):
    full_name: str
    email: EmailStr

@router.put("/account")
def update_account(account: AccountUpdate, current_user: Dict[str, Any] = Depends(get_current_user)):
    from database.sql_utils import update_user_account, get_user_by_email
    
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
    from database.sql_utils import get_user_by_id, update_user_password
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
        
    # Send success email asynchronously
    send_password_changed_success_task.apply_async(args=[db_user["email"]], queue='high_priority')
        
    return {"message": "Password updated successfully"}

#Google Login & Signup Codes
@router.get("/google/login")
@google_auth_router.get("/auth/google/login")
def google_login(role: str = "athlete"):
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
    if not client_id:
        raise HTTPException(status_code=500, detail="Google Client ID not configured")
    
    state_val = f"role:{role}"
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state_val,
        "access_type": "offline",
        "prompt": "select_account"
    }
    url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=url)

@router.get("/google/callback")
@google_auth_router.get("/auth/google/callback")
async def google_callback(code: str = None, state: str = None, error: str = None):
    if error or not code:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}?error=google_auth_failed")
    
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
    
    token_url = os.getenv("GOOGLE_TOKEN_URI", "https://oauth2.googleapis.com/token")
    async with httpx.AsyncClient() as client:
        token_res = await client.post(token_url, data={
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri
        })
        if token_res.status_code != 200:
            print(f"Google token exchange failed: {token_res.text}")
            return RedirectResponse(url=f"{settings.FRONTEND_URL}?error=token_exchange_failed")
        
        token_data = token_res.json()
        access_token = token_data.get("access_token")
        
        user_info_res = await client.get("https://www.googleapis.com/oauth2/v2/userinfo", headers={
            "Authorization": f"Bearer {access_token}"
        })
        if user_info_res.status_code != 200:
            print(f"Google userinfo failed: {user_info_res.text}")
            return RedirectResponse(url=f"{settings.FRONTEND_URL}?error=user_info_failed")
            
        user_info = user_info_res.json()
        
    email = user_info.get("email")
    full_name = user_info.get("name", email.split("@")[0] if email else "Google User")
    picture = user_info.get("picture", "")
    
    if not email:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}?error=no_email_provided")
        
    role = "athlete"
    if state and state.startswith("role:"):
        role_param = state.split(":", 1)[1]
        if role_param in ["athlete", "coach"]:
            role = role_param
            
    existing_user = get_user_by_email(email)
    if existing_user:
        user_id = existing_user["id"]
        roles = get_user_roles(user_id)
        if not roles:
            assign_role(user_id, role)
            roles = [role]
    else:
        dummy_hash = "$2b$12$OAUTH_GOOGLE_ACCOUNT_DO_NOT_USE_PASSWORD_LOGIN_XXXXXXXXX"
        user_id = create_user(email, dummy_hash, full_name)
        if not user_id:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}?error=user_creation_failed")
        assign_role(user_id, role)
        roles = [role]
        
    if picture:
        update_user_profile_picture(user_id, picture)
        
    from database.sql_utils import get_user_by_id
    full_user = get_user_by_id(user_id) or {}
        
    user_payload = {
        "id": user_id,
        "user_id": user_id,
        "email": email,
        "full_name": full_name,
        "roles": roles,
        "profile_picture_url": picture or full_user.get("profile_picture_url"),
        "coach_code": full_user.get("coach_code")
    }
    jwt_token = create_access_token(data={"sub": str(user_id), "email": email, "roles": roles})
    
    user_json = urllib.parse.quote(json.dumps(user_payload))
    redirect_url = f"{settings.FRONTEND_URL}?token={jwt_token}&user={user_json}"
    return RedirectResponse(url=redirect_url)
