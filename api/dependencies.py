from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any
from api.auth.jwt_handler import decode_access_token
from api.auth import get_user_roles

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Decodes the JWT token from the Authorization header and returns the user data.
    Ensures that the athlete_id (user_id) is derived securely from the token.
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject (user_id)",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Optional: fetch roles directly from JWT if embedded, or query MySQL
    roles = payload.get("roles")
    if not roles:
        roles = get_user_roles(int(user_id))
        
    return {
        "user_id": str(user_id),
        "email": payload.get("email"),
        "roles": roles
    }
