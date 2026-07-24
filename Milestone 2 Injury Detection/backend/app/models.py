import enum
from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    Enum as SAEnum,
    Text,
    JSON,
)
from sqlalchemy.orm import relationship

from app.database import Base


class RoleEnum(str, enum.Enum):
    athlete = "athlete"
    coach = "coach"
    physiotherapist = "physiotherapist"
    sports_scientist = "sports_scientist"
    administrator = "administrator"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(RoleEnum), nullable=False, default=RoleEnum.athlete)
    is_active = Column(Integer, default=1)  # 1 = active, 0 = disabled
    created_at = Column(DateTime, default=datetime.utcnow)

    athlete_profile = relationship(
        "AthleteProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )


class AthleteProfile(Base):
    __tablename__ = "athlete_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    sport_type = Column(String(100), nullable=True)
    position = Column(String(100), nullable=True)
    age = Column(Integer, nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    training_load = Column(String(50), nullable=True)  # e.g. Low/Moderate/High
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="athlete_profile")
    injury_history = relationship(
        "InjuryRecord", back_populates="athlete_profile", cascade="all, delete-orphan"
    )
    pose_analyses = relationship(
        "PoseAnalysis",
        back_populates="athlete_profile",
        cascade="all, delete-orphan",
        order_by="desc(PoseAnalysis.created_at)",
    )


class InjuryRecord(Base):
    __tablename__ = "injury_records"

    id = Column(Integer, primary_key=True, index=True)
    athlete_profile_id = Column(
        Integer, ForeignKey("athlete_profiles.id"), nullable=False
    )
    injury_type = Column(String(150), nullable=False)
    body_part = Column(String(100), nullable=True)
    date_occurred = Column(DateTime, default=datetime.utcnow)
    severity = Column(String(50), nullable=True)  # Mild/Moderate/Severe
    recovery_status = Column(String(50), default="Ongoing")
    description = Column(Text, nullable=True)

    athlete_profile = relationship("AthleteProfile", back_populates="injury_history")


class PoseAnalysis(Base):
    """Stores the result of one pose-estimation / biomechanical analysis run."""

    __tablename__ = "pose_analyses"

    id = Column(Integer, primary_key=True, index=True)
    athlete_profile_id = Column(
        Integer, ForeignKey("athlete_profiles.id"), nullable=False
    )
    created_at = Column(DateTime, default=datetime.utcnow)

    source_filename = Column(String(255), nullable=True)
    annotated_image_path = Column(String(255), nullable=True)  # served as static file

    # Computed joint angles in degrees, e.g. {"left_knee": 172.3, "right_knee": 168.1, ...}
    joint_angles = Column(JSON, nullable=True)

    # Left/right differences used as simple asymmetry indicators
    asymmetry = Column(JSON, nullable=True)

    # Human-readable heuristic flags, e.g. ["Knee angle asymmetry above threshold"]
    risk_flags = Column(JSON, nullable=True)

    landmark_confidence = Column(Float, nullable=True)  # avg detection confidence 0-1

    athlete_profile = relationship("AthleteProfile", back_populates="pose_analyses")
