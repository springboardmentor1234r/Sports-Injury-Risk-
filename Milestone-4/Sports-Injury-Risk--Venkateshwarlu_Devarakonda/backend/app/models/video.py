from datetime import datetime, UTC

from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime,
    JSON,
)
from sqlalchemy.orm import relationship

from app.database.base import Base


class Video(Base):
    __tablename__ = "videos"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    athlete_id = Column(
        Integer,
        ForeignKey(
            "athlete_profiles.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    filename = Column(
        String(255),
        nullable=False,
    )

    filepath = Column(
        String(500),
        nullable=False,
    )

    analysis = Column(
        JSON,
        nullable=True,
    )

    uploaded_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
    )

    # Relationship with AthleteProfile
    athlete = relationship(
        "AthleteProfile",
        back_populates="videos",
    )

    # Relationship with InjuryReport
    reports = relationship(
        "InjuryReport",
        back_populates="video",
        cascade="all, delete-orphan",
    )