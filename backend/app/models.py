import enum
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship

from .database import Base


class RoleEnum(str, enum.Enum):
    athlete = "athlete"
    coach = "coach"
    physiotherapist = "physiotherapist"
    sports_scientist = "sports_scientist"
    administrator = "administrator"


class AnalysisStatus(str, enum.Enum):
    processing = "processing"
    completed = "completed"
    failed = "failed"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.athlete)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    athlete_profile = relationship("AthleteProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    uploaded_analyses = relationship("VideoAnalysis", back_populates="uploader", foreign_keys="VideoAnalysis.uploaded_by_id")
    notifications = relationship("Notification", back_populates="recipient", cascade="all, delete-orphan")


class AthleteProfile(Base):
    __tablename__ = "athlete_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    sport_type = Column(String(100), nullable=True)
    position = Column(String(100), nullable=True)
    age = Column(Integer, nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    injury_history = Column(Text, nullable=True)
    training_load = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="athlete_profile")
    analyses = relationship("VideoAnalysis", back_populates="athlete", cascade="all, delete-orphan")


class VideoAnalysis(Base):
    __tablename__ = "video_analyses"

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("athlete_profiles.id"), nullable=False, index=True)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False, unique=True)
    activity = Column(String(80), nullable=False)
    status = Column(Enum(AnalysisStatus), nullable=False, default=AnalysisStatus.processing)
    duration_seconds = Column(Float, nullable=True)
    fps = Column(Float, nullable=True)
    frame_count = Column(Integer, nullable=True)
    quality_score = Column(Float, nullable=True)
    pose_confidence = Column(Float, nullable=True)
    pose_engine = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    processed_at = Column(DateTime, nullable=True)

    athlete = relationship("AthleteProfile", back_populates="analyses")
    uploader = relationship("User", back_populates="uploaded_analyses", foreign_keys=[uploaded_by_id])
    result = relationship("RiskAssessment", back_populates="analysis", uselist=False, cascade="all, delete-orphan")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("video_analyses.id"), unique=True, nullable=False)
    overall_risk = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)
    movement_quality_score = Column(Float, nullable=False)
    biomechanical_score = Column(Float, nullable=False)
    symmetry_score = Column(Float, nullable=False)
    fatigue_score = Column(Float, nullable=False)
    metrics = Column(JSON, nullable=False, default=dict)
    injury_probabilities = Column(JSON, nullable=False, default=dict)
    findings = Column(JSON, nullable=False, default=list)
    recommendations = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    analysis = relationship("VideoAnalysis", back_populates="result")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(160), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(20), nullable=False, default="info")
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    recipient = relationship("User", back_populates="notifications")
