from fastapi import Depends, HTTPException, status
from typing import List

from app.models.user import UserDoc, UserRole
from app.services.auth_service import get_current_user

class RoleChecker:
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: UserDoc = Depends(get_current_user)) -> UserDoc:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Action not allowed for your role"
            )
        return current_user

# Shortcuts
allow_admin = RoleChecker([UserRole.ADMIN])
allow_coach = RoleChecker([UserRole.COACH])
allow_physiotherapist = RoleChecker([UserRole.PHYSIOTHERAPIST])
allow_athlete = RoleChecker([UserRole.ATHLETE])
