import enum
import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.postgres import Base

class UserRole(str, enum.Enum):
    ATHLETE = "Athlete"
    COACH = "Coach"
    PHYSIOTHERAPIST = "Physiotherapist"
    SPORTS_SCIENTIST = "Sports Scientist"
    ADMINISTRATOR = "Administrator"

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(255), nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.ATHLETE)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    athlete_profile = relationship("AthleteProfile", foreign_keys="[AthleteProfile.user_id]", back_populates="user", uselist=False, cascade="all, delete-orphan")
    injury_histories = relationship("InjuryHistory", back_populates="user", cascade="all, delete-orphan")
    physical_assessments = relationship("PhysicalAssessmentRecord", back_populates="user", cascade="all, delete-orphan")

class AthleteProfile(Base):
    __tablename__ = "athlete_profiles"

    profile_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    athlete_id = Column(String(100), unique=True, index=True, nullable=False)
    sport_type = Column(String(100), nullable=False)
    position = Column(String(100), nullable=True)
    age = Column(Integer, nullable=False)
    height = Column(Float, nullable=False) # in cm
    weight = Column(Float, nullable=False) # in kg
    training_load = Column(Float, default=0.0) # Acute:Chronic workload or weekly hours
    coach_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    physio_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="athlete_profile")
    coach = relationship("User", foreign_keys=[coach_id])
    physio = relationship("User", foreign_keys=[physio_id])

class InjuryHistory(Base):
    __tablename__ = "injury_histories"

    history_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    injury_type = Column(String(255), nullable=False)
    recovery_status = Column(String(100), nullable=False, default="Recovered") # e.g. Active Rehab, Recovered, Monitoring
    date_of_injury = Column(String(50), nullable=False)

    # Relationships
    user = relationship("User", back_populates="injury_histories")

class PhysicalAssessmentRecord(Base):
    __tablename__ = "physical_assessment_records"

    assessment_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    assessment_date = Column(DateTime, default=datetime.datetime.utcnow)
    metrics_summary = Column(JSON, nullable=True) # JSON store for keypoint angles, asymmetry %, risk scores

    # Relationships
    user = relationship("User", back_populates="physical_assessments")
