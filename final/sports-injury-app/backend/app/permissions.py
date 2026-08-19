"""
permissions.py
----------------
Shared authorization helpers used by injury/performance/assessment/training-load
routers. Centralizing this logic means the "who can touch which athlete's data"
rule is defined ONCE, instead of copy-pasted (and drifting out of sync) across
four separate router files.
"""

import uuid
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models
from app.auth import get_current_user
from app.database import get_db

# Roles allowed to read any athlete's sub-resources (profile-level records)
STAFF_ROLES = (
    models.UserRole.coach,
    models.UserRole.physiotherapist,
    models.UserRole.sports_scientist,
    models.UserRole.admin,
)


def get_athlete_profile_or_404(db: Session, profile_id: uuid.UUID) -> models.AthleteProfile:
    profile = db.query(models.AthleteProfile).filter(models.AthleteProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Athlete profile not found")
    return profile


def require_profile_read_access(
    profile_id: uuid.UUID,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> models.AthleteProfile:
    """
    An athlete may read their own sub-resources. Staff roles may read any
    athlete's. Anyone else is forbidden.
    """
    profile = get_athlete_profile_or_404(db, profile_id)

    is_owner = (
        current_user.role == models.UserRole.athlete
        and profile.user_id == current_user.id
    )
    is_staff = current_user.role in STAFF_ROLES

    if not (is_owner or is_staff):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to view this athlete's data")

    return profile


def require_roles_for_write(*allowed_roles: models.UserRole):
    """
    Factory for a dependency that only allows specific roles to create/edit/delete
    a given sub-resource (e.g. only physiotherapist/admin can write injury records).
    """
    def checker(current_user: models.User = Depends(get_current_user)) -> models.User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Only {', '.join(r.value for r in allowed_roles)} can perform this action",
            )
        return current_user
    return checker
