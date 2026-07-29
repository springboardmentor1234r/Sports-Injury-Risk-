from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, UTC

from app.database.base import Base


class InjuryReport(Base):
    __tablename__ = "injury_reports"

    id = Column(Integer, primary_key=True, index=True)

    athlete_id = Column(
        Integer,
        ForeignKey("athlete_profiles.id"),
        nullable=False
    )

    injury_risk = Column(Float, nullable=False)

    risk_level = Column(String(20), nullable=False)

    body_part = Column(String(50), nullable=False)

    recommendation = Column(String(255), nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC)
    )

    athlete = relationship(
        "AthleteProfile",
        back_populates="reports"
    )