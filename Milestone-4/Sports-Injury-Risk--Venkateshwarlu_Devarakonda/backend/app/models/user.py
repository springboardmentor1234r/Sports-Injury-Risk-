from datetime import datetime, UTC

from sqlalchemy import DateTime, Integer, String, Column, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    username: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )

    password_hash: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    google_id: Mapped[str | None] = mapped_column(
        String(255),
        unique=True,
        nullable=True,
        index=True
    )

    role: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="athlete",
        index=True
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC)
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC)
    )

    athlete_profile = relationship(
        "AthleteProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )

    coach_profile = relationship(
        "CoachProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )

    physiotherapist_profile = relationship(
        "PhysiotherapistProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )

    sports_scientist_profile = relationship(
        "SportsScientistProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )