from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, UTC

from app.database.base import Base


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)

    athlete_id = Column(
        Integer,
        ForeignKey("athlete_profiles.id"),
        nullable=False
    )

    filename = Column(String(255), nullable=False)

    filepath = Column(String(500), nullable=False)

    uploaded_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC)
    )

    athlete = relationship(
        "AthleteProfile",
        back_populates="videos"
    )