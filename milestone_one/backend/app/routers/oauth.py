import os
from fastapi import APIRouter, Depends, HTTPException, Request, status
from typing import Optional
from app.core.oauth import oauth
from app.database import get_db
from app.core.security import create_access_token
from app.models.user import UserDoc, UserRole
from app.schemas.auth import Token

router = APIRouter(prefix="/auth/google", tags=["Google OAuth2"])

@router.get("/login")
async def google_login(request: Request, role: Optional[str] = "athlete"):
    request.session["oauth_role"] = role
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)

from fastapi.responses import RedirectResponse

@router.get("/callback")
async def google_callback(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth authorization failed: {str(e)}"
        )
    
    # Extract user info
    user_info = token.get("userinfo")
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to retrieve user details from Google"
        )
        
    email = user_info.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account does not provide email"
        )
        
    db = get_db()
    user_dict = await db.users.find_one({"email": email})
    
    if not user_dict:
        # Retrieve selected role from session, validate and fallback to athlete if invalid
        role_str = request.session.pop("oauth_role", "athlete")
        try:
            user_role = UserRole(role_str)
        except ValueError:
            user_role = UserRole.ATHLETE

        # Create a new user with the selected role
        user_doc = UserDoc(
            email=email,
            hashed_password="",  # OAuth users do not have a local password
            role=user_role
        )
        await db.users.insert_one(user_doc.model_dump())
        user_dict = user_doc.model_dump()
    else:
        # Ensure session is cleaned up even if user already exists
        request.session.pop("oauth_role", None)
        
    user = UserDoc(**user_dict)
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
        
    access_token = create_access_token(subject=user.id, role=user.role)
    
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    return RedirectResponse(url=f"{frontend_url}/auth/callback?token={access_token}")
