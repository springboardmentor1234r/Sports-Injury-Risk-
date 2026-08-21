from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class PhysiotherapistProfileBase(BaseModel):
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=150,
    )

    phone: str | None = Field(
        default=None,
        max_length=20,
    )

    specialization: str | None = Field(
        default=None,
        max_length=150,
    )

    sport: str | None = Field(
        default=None,
        max_length=100,
    )

    experience: float | None = Field(
        default=None,
        ge=0,
    )

    organization: str | None = Field(
        default=None,
        max_length=150,
    )

    certification: str | None = Field(
        default=None,
        max_length=200,
    )


class PhysiotherapistProfileCreate(
    PhysiotherapistProfileBase
):
    pass


class PhysiotherapistProfileUpdate(BaseModel):
    full_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    phone: str | None = Field(
        default=None,
        max_length=20,
    )

    specialization: str | None = Field(
        default=None,
        max_length=150,
    )

    sport: str | None = Field(
        default=None,
        max_length=100,
    )

    experience: float | None = Field(
        default=None,
        ge=0,
    )

    organization: str | None = Field(
        default=None,
        max_length=150,
    )

    certification: str | None = Field(
        default=None,
        max_length=200,
    )


class PhysiotherapistProfileResponse(
    PhysiotherapistProfileBase
):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )