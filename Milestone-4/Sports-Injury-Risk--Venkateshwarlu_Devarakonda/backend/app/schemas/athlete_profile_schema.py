from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AthleteProfileBase(BaseModel):
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=150
    )

    age: int | None = Field(
        default=None,
        ge=5,
        le=100
    )

    gender: str | None = Field(
        default=None,
        max_length=20
    )

    sport: str | None = Field(
        default=None,
        max_length=100
    )

    height: float | None = Field(
        default=None,
        gt=0,
        le=300
    )

    weight: float | None = Field(
        default=None,
        gt=0,
        le=500
    )

    experience_years: float | None = Field(
        default=None,
        ge=0,
        le=80
    )

    position: str | None = Field(
        default=None,
        max_length=100
    )

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Full name is required")

        return value

    @field_validator("gender", "sport", "position")
    @classmethod
    def validate_text_fields(
        cls,
        value: str | None
    ) -> str | None:
        if value is None:
            return None

        value = value.strip()

        return value or None


class AthleteProfileCreate(AthleteProfileBase):
    pass


class AthleteProfileUpdate(BaseModel):
    full_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150
    )

    age: int | None = Field(
        default=None,
        ge=5,
        le=100
    )

    gender: str | None = Field(
        default=None,
        max_length=20
    )

    sport: str | None = Field(
        default=None,
        max_length=100
    )

    height: float | None = Field(
        default=None,
        gt=0,
        le=300
    )

    weight: float | None = Field(
        default=None,
        gt=0,
        le=500
    )

    experience_years: float | None = Field(
        default=None,
        ge=0,
        le=80
    )

    position: str | None = Field(
        default=None,
        max_length=100
    )

    @field_validator(
        "full_name",
        "gender",
        "sport",
        "position"
    )
    @classmethod
    def validate_text_fields(
        cls,
        value: str | None
    ) -> str | None:
        if value is None:
            return None

        value = value.strip()

        return value or None


class AthleteProfileResponse(AthleteProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )