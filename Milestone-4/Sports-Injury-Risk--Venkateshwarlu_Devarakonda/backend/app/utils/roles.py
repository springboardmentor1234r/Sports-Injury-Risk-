from fastapi import Depends, HTTPException, status


VALID_ROLES = {
    "athlete",
    "coach",
    "physiotherapist",
    "sports_scientist",
    "admin",
}


ROLE_DISPLAY_NAMES = {
    "athlete": "Athlete",
    "coach": "Coach",
    "physiotherapist": "Physiotherapist",
    "sports_scientist": "Sports Scientist",
    "admin": "Administrator",
}


ROLE_ALIASES = {
    "athlete": "athlete",
    "coach": "coach",
    "physiotherapist": "physiotherapist",
    "physio": "physiotherapist",
    "sports_scientist": "sports_scientist",
    "sport_scientist": "sports_scientist",
    "sports scientist": "sports_scientist",
    "sport scientist": "sports_scientist",
    "sportsscientist": "sports_scientist",
    "admin": "admin",
    "administrator": "admin",
}


def validate_role(role: str) -> str:
    if role is None:
        raise ValueError(
            "Role is required"
        )

    normalized_role = (
        str(role)
        .strip()
        .lower()
        .replace("-", "_")
    )

    normalized_role = ROLE_ALIASES.get(
        normalized_role,
        normalized_role,
    )

    if not normalized_role:
        raise ValueError(
            "Role is required"
        )

    if normalized_role not in VALID_ROLES:
        allowed_roles = ", ".join(
            sorted(VALID_ROLES)
        )

        raise ValueError(
            f"Invalid role: '{role}'. "
            f"Allowed roles: {allowed_roles}"
        )

    return normalized_role


def get_role_display_name(role: str) -> str:
    normalized_role = validate_role(role)

    return ROLE_DISPLAY_NAMES[
        normalized_role
    ]


def require_role(*allowed_roles: str):
    if not allowed_roles:
        raise ValueError(
            "At least one role is required"
        )

    normalized_roles = {
        validate_role(role)
        for role in allowed_roles
    }

    from app.utils.dependencies import (
        get_current_user,
    )

    def role_checker(
        current_user: dict = Depends(
            get_current_user
        )
    ):
        current_role = current_user.get(
            "role"
        )

        if not current_role:
            raise HTTPException(
                status_code=(
                    status.HTTP_403_FORBIDDEN
                ),
                detail="User role is missing",
            )

        try:
            current_role = validate_role(
                current_role
            )

        except ValueError:
            raise HTTPException(
                status_code=(
                    status.HTTP_403_FORBIDDEN
                ),
                detail="Invalid user role",
            )

        if current_role not in normalized_roles:
            raise HTTPException(
                status_code=(
                    status.HTTP_403_FORBIDDEN
                ),
                detail=(
                    "Access denied for "
                    "this role"
                ),
            )

        return current_user

    return role_checker


def user_has_role(
    current_user: dict,
    *allowed_roles: str,
) -> bool:
    if not allowed_roles:
        return False

    current_role = current_user.get(
        "role"
    )

    if not current_role:
        return False

    try:
        current_role = validate_role(
            current_role
        )

        normalized_roles = {
            validate_role(role)
            for role in allowed_roles
        }

    except ValueError:
        return False

    return current_role in normalized_roles


def is_admin(
    current_user: dict,
) -> bool:
    return user_has_role(
        current_user,
        "admin",
    )