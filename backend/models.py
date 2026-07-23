import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, Numeric, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


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


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id"), nullable=False)
    file_path = Column(String(255), nullable=False)
    activity_type = Column(String(50))
    status = Column(String(50), default="uploaded")
    uploaded_at = Column(DateTime, server_default=func.now())


class PoseResult(Base):
    __tablename__ = "pose_results"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    frame_count = Column(Integer)
    total_frames = Column(Integer)
    keypoints_json = Column(JSONB)
    created_at = Column(DateTime, server_default=func.now())


class BiomechanicsResult(Base):
    __tablename__ = "biomechanics_results"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    analysis_json = Column(JSONB)
    created_at = Column(DateTime, server_default=func.now())

class QualityReport(Base):
    __tablename__ = "quality_reports"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    quality_score = Column(Numeric(5, 2))
    risk_category = Column(String(20))
    report_json = Column(JSONB)
    created_at = Column(DateTime, server_default=func.now())