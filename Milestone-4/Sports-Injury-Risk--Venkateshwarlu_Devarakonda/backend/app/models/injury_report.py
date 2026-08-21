from datetime import datetime, UTC

from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    ForeignKey,
    DateTime,
    Text,
)
from sqlalchemy.orm import relationship

from app.database.base import Base


class InjuryReport(Base):
    __tablename__ = "injury_reports"

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

    video_id = Column(
        Integer,
        ForeignKey(
            "videos.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    injury_risk = Column(
        Float,
        nullable=False,
    )

    risk_level = Column(
        String(20),
        nullable=False,
    )

    body_part = Column(
        String(100),
        nullable=False,
    )

    recommendation = Column(
        Text,
        nullable=False,
    )

    movement_quality = Column(
        Float,
        nullable=False,
        default=0,
    )

    balance_score = Column(
        Float,
        nullable=False,
        default=0,
    )

    symmetry_score = Column(
        Float,
        nullable=False,
        default=0,
    )

    range_of_motion = Column(
        Float,
        nullable=False,
        default=0,
    )

    doctor_notes = Column(
        Text,
        nullable=True,
    )

    physio_notes = Column(
        Text,
        nullable=True,
    )

    coach_notes = Column(
        Text,
        nullable=True,
    )

    status = Column(
        String(30),
        nullable=False,
        default="Pending",
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
    )

    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    athlete = relationship(
        "AthleteProfile",
        back_populates="reports",
    )

    video = relationship(
        "Video",
        back_populates="reports",
    )