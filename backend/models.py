from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, Numeric, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class UserRole(str, enum.Enum):
    athlete = "athlete"
    coach = "coach"
    physiotherapist = "physiotherapist"
    sports_scientist = "sports_scientist"
    admin = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.athlete, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    athlete_profile = relationship("Athlete", back_populates="user", uselist=False)

class Athlete(Base):
    __tablename__ = "athletes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    sport_type = Column(String(100))
    position = Column(String(100))
    age = Column(Integer)
    height_cm = Column(Numeric(5, 2))
    weight_kg = Column(Numeric(5, 2))
    injury_history = Column(Text)
    training_load = Column(String(50))

    user = relationship("User", back_populates="athlete_profile")