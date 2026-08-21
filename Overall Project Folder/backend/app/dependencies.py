from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Optional, Dict, Any
from app.auth import decode_access_token
from app.database import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
        
    db = get_db()
    users_coll = db.get_collection("users")
    user = await users_coll.find_one({"id": user_id})
    if user is None:
        user = await users_coll.find_one({"_id": user_id})
        
    if user is None:
        raise credentials_exception
        
    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is deactivated")
        
    # Attach linked athlete_id if present
    if user.get("role") == "athlete":
        athletes_coll = db.get_collection("athletes")
        athlete = await athletes_coll.find_one({"user_id": user_id})
        if athlete:
            user["athlete_id"] = athlete.get("id") or athlete.get("_id")

    return user

def require_roles(allowed_roles: list):
    """Dependency to restrict route access to specific roles."""
    async def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)):
        user_role = current_user.get("role", "").lower()
        allowed = [r.lower() for r in allowed_roles]
        if user_role not in allowed and "admin" not in allowed: # admin can access most unless restricted
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Role '{user_role}' is not authorized for this resource."
            )
        return current_user
    return role_checker

async def verify_athlete_access(
    target_athlete_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> bool:
    """
    CRITICAL SECURITY CHECK:
    Enforces strict data isolation.
    If logged in user is an athlete:
      - Can ONLY access their own athlete profile and data.
      - Any attempt to request another athlete's data raises 403 Forbidden.
    Coaches, Physiotherapists, Sports Scientists, and Admins can access registered athletes.
    """
    user_role = current_user.get("role", "").lower()
    
    if user_role == "athlete":
        db = get_db()
        athletes_coll = db.get_collection("athletes")
        
        # Find athlete record linked to current user
        user_athlete = await athletes_coll.find_one({"user_id": current_user.get("id") or current_user.get("_id")})
        if not user_athlete:
            user_athlete = await athletes_coll.find_one({"email": current_user.get("email")})
            
        user_athlete_id = user_athlete.get("id") or user_athlete.get("_id") if user_athlete else None
        
        if not user_athlete_id or user_athlete_id != target_athlete_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You are not authorized to view or modify another athlete's private data."
            )
    return True
