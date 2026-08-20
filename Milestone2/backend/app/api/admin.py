from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.postgres import get_db
from app.models.sql_models import User, UserRole
from app.core.rbac import require_roles

router = APIRouter(prefix="/admin", tags=["System Administration & RBAC Management"])

class RoleUpdateSchema(BaseModel):
    role: UserRole

@router.get("/users", response_model=List[dict], status_code=status.HTTP_200_OK)
def get_all_users_for_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR]))
):
    """
    Retrieve real list of registered users in PostgreSQL database with active status indicators.
    """
    users = db.query(User).all()
    user_list = []
    for u in users:
        role_str = u.role.value if isinstance(u.role, UserRole) else str(u.role)
        user_list.append({
            "id": u.user_id,
            "name": u.full_name or u.email,
            "email": u.email,
            "role": role_str,
            "status": "Active",
            "created_at": u.created_at.isoformat() if u.created_at else None
        })
    return user_list

@router.patch("/users/{user_id}/role", status_code=status.HTTP_200_OK)
def update_user_role(
    user_id: int,
    role_in: RoleUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR]))
):
    """
    Update a user's RBAC role in PostgreSQL database.
    """
    target_user = db.query(User).filter(User.user_id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    target_user.role = role_in.role
    db.commit()
    db.refresh(target_user)

    role_str = target_user.role.value if isinstance(target_user.role, UserRole) else str(target_user.role)
    return {
        "status": "success",
        "message": f"Updated role for user '{target_user.email}' to '{role_str}'",
        "user_id": target_user.user_id,
        "new_role": role_str
    }
