import enum
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text
)
from sqlalchemy.orm import relationship

from .database import Base


class RoleEnum(str, enum.Enum):
    athlete = "athlete"
    coach = "coach"
    physiotherapist = "physiotherapist"
    sports_scientist = "sports_scientist"
    administrator = "administrator"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.athlete)
    created_at = Column(DateTime, default=datetime.utcnow)

    athlete_profile = relationship(
        "AthleteProfile", back_populates="user", uselist=False,
        cascade="all, delete-orphan"
    )


class AthleteProfile(Base):
    """
    Matches the 'Athlete Information' fields from the project spec:
    Athlete ID, Sport Type, Position, Age, Height, Weight, Injury History, Training Load
    """
    __tablename__ = "athlete_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    sport_type = Column(String, nullable=True)
    position = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    injury_history = Column(Text, nullable=True)   # simple text log for Milestone 1
    training_load = Column(String, nullable=True)  # e.g. "low" / "moderate" / "high"

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="athlete_profile")
