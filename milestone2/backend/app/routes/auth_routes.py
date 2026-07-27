import httpx
from datetime import datetime, timedelta
from urllib.parse import urlencode, quote
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from app.config import settings
from app.database import get_db
from app.schemas import UserRegister, UserLogin, UserResponse, TokenSchema, UserRole
from app.auth import hash_password, verify_password, create_access_token
import logging

logger = logging.getLogger("sird.auth")
router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db = Depends(get_db)):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    new_user = {
        "email": user_data.email.lower(),
        "password": hash_password(user_data.password),
        "fullname": user_data.fullname,
        "role": user_data.role.value,
        "auth_provider": "local",
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(new_user)
    
    return UserResponse(
        id=str(result.inserted_id),
        email=new_user["email"],
        fullname=new_user["fullname"],
        role=UserRole(new_user["role"]),
        created_at=new_user["created_at"]
    )

@router.post("/login", response_model=TokenSchema)
async def login(credentials: UserLogin, db = Depends(get_db)):
    user = await db.users.find_one({"email": credentials.email.lower()})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    if user.get("auth_provider") == "google" and not user.get("password"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account is registered via Google. Please log in with Google.",
        )
        
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
        
    token = create_access_token(subject=user["email"])
    return TokenSchema(
        access_token=token,
        token_type="bearer",
        role=user["role"],
        fullname=user["fullname"],
        email=user["email"]
    )

@router.get("/google/login")
async def google_login(role: UserRole):
    """
    Initiates Google OAuth2 login flow by redirecting the user to Google.
    The selected role is encoded in the 'state' parameter to persist it.
    """
    google_auth_url = "https://accounts.google.com/o/oauth2/v2/auth"
    state = f"role:{role.value}"
    
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "select_account"
    }
    
    redirect_url = f"{google_auth_url}?{urlencode(params)}"
    return RedirectResponse(redirect_url)

@router.get("/google/callback")
async def google_callback(code: str = None, state: str = None, error: str = None, db = Depends(get_db)):
    if error:
        logger.error(f"Google OAuth error: {error}")
        return RedirectResponse(f"{settings.FRONTEND_URL}/auth?error={quote(error)}")
        
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code is missing")
        
    # Extract role from state parameter
    selected_role = "Athlete" # fallback
    if state and state.startswith("role:"):
        selected_role = state.split("role:")[1]
        
    # Exchange code for token
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            token_response = await client.post(token_url, data=token_data)
            token_response.raise_for_status()
            tokens = token_response.json()
            access_token = tokens.get("access_token")
            
            # Fetch user info
            userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
            headers = {"Authorization": f"Bearer {access_token}"}
            userinfo_response = await client.get(userinfo_url, headers=headers)
            userinfo_response.raise_for_status()
            user_info = userinfo_response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Failed to communicate with Google: {e.response.text}")
            return RedirectResponse(f"{settings.FRONTEND_URL}/auth?error=google_auth_failed")
        except Exception as e:
            logger.error(f"Error during Google callback exchange: {str(e)}")
            return RedirectResponse(f"{settings.FRONTEND_URL}/auth?error=google_auth_failed")
            
    email = user_info.get("email", "").lower()
    fullname = user_info.get("name", "Google User")
    
    if not email:
        return RedirectResponse(f"{settings.FRONTEND_URL}/auth?error=no_email_provided")
        
    # Check if user exists
    user = await db.users.find_one({"email": email})
    
    if not user:
        # Create user
        new_user = {
            "email": email,
            "fullname": fullname,
            "role": selected_role,
            "auth_provider": "google",
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(new_user)
        user = new_user
        
    # Generate JWT
    token = create_access_token(subject=user["email"])
    
    # Redirect back to frontend callback page
    redirect_target = (
        f"{settings.FRONTEND_URL}/auth/callback"
        f"?token={token}"
        f"&role={quote(user['role'])}"
        f"&fullname={quote(user['fullname'])}"
        f"&email={quote(user['email'])}"
    )
    return RedirectResponse(redirect_target)
