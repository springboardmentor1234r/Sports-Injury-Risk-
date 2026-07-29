from sqlalchemy import Column, Integer, Float, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class AthleteProfile(Base):
    __tablename__ = "athlete_profiles"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    age = Column(Integer, nullable=False)

    gender = Column(String(20), nullable=False)

    height = Column(Float, nullable=False)

    weight = Column(Float, nullable=False)

    sport = Column(String(50), nullable=False)

    experience = Column(Float, nullable=False)

    position = Column(String(50), nullable=True)

    user = relationship(
        "User",
        back_populates="profile"
    )   
    reports = relationship(
    "InjuryReport",
    back_populates="athlete",
    cascade="all, delete"
    )
    videos = relationship(
    "Video",
    back_populates="athlete",
    cascade="all, delete"
)