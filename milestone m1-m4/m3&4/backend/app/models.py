from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), default="athlete") # athlete, coach, physiotherapist, admin
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Advanced Authentication columns
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String(255), nullable=True)
    reset_token = Column(String(255), nullable=True)
    refresh_token = Column(String(255), nullable=True)
    last_login = Column(DateTime, nullable=True)

    # One-to-one relationship with Athlete (if user is an athlete)
    athlete_profile = relationship("Athlete", uselist=False, back_populates="user", cascade="all, delete-orphan")


class Athlete(Base):
    __tablename__ = "athletes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    date_of_birth = Column(Date, nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    sport = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="athlete_profile")
    injury_history = relationship("InjuryHistory", back_populates="athlete", cascade="all, delete-orphan")
    training_load = relationship("TrainingLoad", back_populates="athlete", cascade="all, delete-orphan")
    videos = relationship("Video", back_populates="athlete", cascade="all, delete-orphan")


class InjuryHistory(Base):
    __tablename__ = "injury_history"

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id", ondelete="CASCADE"), nullable=False)
    injury_type = Column(String(100), nullable=False) # e.g. Sprain, Strain, Fracture
    body_part = Column(String(100), nullable=False) # e.g. Knee, Ankle, Shoulder
    severity = Column(String(20), nullable=False) # e.g. Low, Medium, High
    occurrence_date = Column(Date, nullable=False)
    status = Column(String(20), default="active") # active, rehab, recovered
    notes = Column(Text, nullable=True)

    # Relationships
    athlete = relationship("Athlete", back_populates="injury_history")


class TrainingLoad(Base):
    __tablename__ = "training_load"

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, default=datetime.date.today, nullable=False)
    activity_type = Column(String(100), nullable=False) # e.g. Running, Weightlifting, Swimming
    duration_minutes = Column(Integer, nullable=False)
    rpe = Column(Integer, nullable=False) # Rate of Perceived Exertion (1 to 10)
    calculated_load = Column(Integer, nullable=False) # duration * rpe (automatic on save)
    notes = Column(Text, nullable=True)

    # Relationships
    athlete = relationship("Athlete", back_populates="training_load")


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String(255), nullable=False)
    status = Column(String(20), default="uploaded") # uploaded, processing, analyzed
    dataset_source = Column(String(50), nullable=True) # e.g. Human3.6M, MPII, COCO, SportsPose, custom
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Advanced Pose Estimation fields
    skeletal_data = Column(Text, nullable=True) # Stores joint keypoint frame coordinates (JSON format)
    movement_score = Column(Float, nullable=True) # Overall grade from biomechanics (0-100)
    analysis_summary = Column(Text, nullable=True) # Form warnings or posture alerts

    # Relationships
    athlete = relationship("Athlete", back_populates="videos")


class IntelligenceAssessment(Base):
    """A versioned, explainable analytical assessment; not a clinical diagnosis."""
    __tablename__ = "intelligence_assessments"

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id", ondelete="CASCADE"), nullable=False, index=True)
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="SET NULL"), nullable=True)
    assessed_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)
    injury_risk_score = Column(Float, nullable=False)
    risk_category = Column(String(20), nullable=False)
    risk_probability = Column(Float, nullable=False)
    movement_quality_score = Column(Float, nullable=False)
    biomechanical_efficiency_score = Column(Float, nullable=False)
    fatigue_risk_score = Column(Float, nullable=False)
    health_score = Column(Float, nullable=False)
    scoring_breakdown = Column(Text, nullable=False)
    risk_predictions = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)

    athlete = relationship("Athlete")
    video = relationship("Video")


class MovementAnomaly(Base):
    __tablename__ = "movement_anomalies"

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id", ondelete="CASCADE"), nullable=False, index=True)
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), nullable=True, index=True)
    assessment_id = Column(Integer, ForeignKey("intelligence_assessments.id", ondelete="SET NULL"), nullable=True)
    detected_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    anomaly_type = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False)
    frame_index = Column(Integer, nullable=True)
    body_region = Column(String(100), nullable=False)
    explanation = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_id = Column(Integer, ForeignKey("intelligence_assessments.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    category = Column(String(50), nullable=False)
    priority = Column(String(20), nullable=False)
    recommendation = Column(Text, nullable=False)
    rationale = Column(Text, nullable=False)
