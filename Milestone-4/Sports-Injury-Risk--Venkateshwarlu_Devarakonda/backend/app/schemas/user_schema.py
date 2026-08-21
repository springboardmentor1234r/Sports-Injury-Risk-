from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
)


VALID_ROLES = {
    "athlete",
    "coach",
    "physiotherapist",
    "sports_scientist",
    "admin",
}

REGISTRATION_ROLES = {
    "athlete",
    "coach",
    "physiotherapist",
    "sports_scientist",
}


class UserBase(BaseModel):
    username: str = Field(
        ...,
        min_length=3,
        max_length=100
    )

    email: EmailStr

    role: str = Field(
        default="athlete",
        max_length=50
    )

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError(
                "Username is required"
            )

        return value

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        value = value.strip().lower()

        if value not in VALID_ROLES:
            raise ValueError(
                "Invalid role. Allowed roles: "
                + ", ".join(
                    sorted(VALID_ROLES)
                )
            )

        return value


class UserCreate(UserBase):
    password: str = Field(
        ...,
        min_length=8,
        max_length=128
    )

    @field_validator("role")
    @classmethod
    def validate_registration_role(
        cls,
        value: str
    ) -> str:
        value = value.strip().lower()

        if value not in REGISTRATION_ROLES:
            raise ValueError(
                "Admin accounts cannot be created "
                "through normal registration"
            )

        return value


class UserLogin(BaseModel):
    email: EmailStr

    password: str = Field(
        ...,
        min_length=1,
        max_length=128
    )


class UserUpdate(BaseModel):
    username: str | None = Field(
        default=None,
        min_length=3,
        max_length=100
    )

    email: EmailStr | None = None

    role: str | None = Field(
        default=None,
        max_length=50
    )

    is_active: bool | None = None

    @field_validator("username")
    @classmethod
    def validate_username(
        cls,
        value: str | None
    ) -> str | None:
        if value is None:
            return None

        value = value.strip()

        if not value:
            raise ValueError(
                "Username cannot be empty"
            )

        return value

    @field_validator("role")
    @classmethod
    def validate_role(
        cls,
        value: str | None
    ) -> str | None:
        if value is None:
            return None

        value = value.strip().lower()

        if value not in VALID_ROLES:
            raise ValueError(
                "Invalid role. Allowed roles: "
                + ", ".join(
                    sorted(VALID_ROLES)
                )
            )

        return value


class UserResponse(UserBase):
    id: int

    is_active: bool

    created_at: datetime

    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class Token(BaseModel):
    access_token: str

    token_type: str = "bearer"

    username: str

    role: str