"""
models.py
----------
Defines our database tables as Python classes (SQLAlchemy ORM models).

Milestone 1 tables:
- User            -> login credentials + role
- AthleteProfile  -> extra info that only exists for users with role="athlete"
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, Float, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class UserRole(str, enum.Enum):
    athlete = "athlete"
    coach = "coach"
    physiotherapist = "physiotherapist"
    sports_scientist = "sports_scientist"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # One user (if role=athlete) can have exactly one athlete profile
    athlete_profile = relationship(
        "AthleteProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )


class AthleteProfile(Base):
    __tablename__ = "athlete_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)

    sport_type = Column(String, nullable=True)
    position = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    injury_history = Column(Text, nullable=True)  # simple text for Milestone 1
    training_load = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="athlete_profile")
