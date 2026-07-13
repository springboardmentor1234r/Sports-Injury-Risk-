from fastapi import Depends, HTTPException
from app.utils.dependencies import get_current_user

def require_role(allowed_roles: list):
    def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="Access denied"
            )
        return current_user

    return role_checker