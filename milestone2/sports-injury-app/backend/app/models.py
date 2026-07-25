"""
models.py
----------
Defines our database tables as Python classes (SQLAlchemy ORM models).

Tables:
- User               -> login credentials + role
- AthleteProfile     -> core bio info for users with role="athlete"
- InjuryRecord        -> structured injury history (one row per injury)
- PerformanceMetric   -> point-in-time performance test results (sprint times, jump height, etc.)
- PhysicalAssessment  -> periodic clinical/screening assessments by a physio or sports scientist
- TrainingLoadEntry   -> one row per training session, for tracking load over time
- Video               -> one uploaded movement video and its processing status
- VideoFrame          -> one row per analyzed frame: pose keypoints + computed joint angles

Design note: injury_history and training_load used to be single free-text/string
fields directly on AthleteProfile. That doesn't scale — you can't query "how many
ACL injuries in the last 6 months" or "average weekly training load" out of a text
blob. Each is now its own table with one row per event, which is what lets the
injury risk scoring engine (Milestone 3) actually compute its weighted inputs.
"""

import enum
import uuid
from datetime import datetime, date

from sqlalchemy import (
    Column, String, Integer, Float, DateTime, Date, Enum, ForeignKey, Text, Boolean, Index, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class UserRole(str, enum.Enum):
    athlete = "athlete"
    coach = "coach"
    physiotherapist = "physiotherapist"
    sports_scientist = "sports_scientist"
    admin = "admin"


class InjurySeverity(str, enum.Enum):
    mild = "mild"
    moderate = "moderate"
    severe = "severe"


class RecoveryStatus(str, enum.Enum):
    active = "active"          # injury is current, athlete is not fully training
    recovering = "recovering"  # in rehab, partial return to training
    recovered = "recovered"    # fully cleared


class BodyPart(str, enum.Enum):
    knee = "knee"
    ankle = "ankle"
    hamstring = "hamstring"
    shoulder = "shoulder"
    lower_back = "lower_back"
    hip = "hip"
    calf = "calf"
    groin = "groin"
    other = "other"


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

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="athlete_profile")
    injury_records = relationship("InjuryRecord", back_populates="athlete_profile", cascade="all, delete-orphan")
    performance_metrics = relationship("PerformanceMetric", back_populates="athlete_profile", cascade="all, delete-orphan")
    physical_assessments = relationship("PhysicalAssessment", back_populates="athlete_profile", cascade="all, delete-orphan")
    training_load_entries = relationship("TrainingLoadEntry", back_populates="athlete_profile", cascade="all, delete-orphan")
    videos = relationship("Video", back_populates="athlete_profile", cascade="all, delete-orphan")


class InjuryRecord(Base):
    """
    One row per injury. Write access restricted to physiotherapist/admin
    (see routers/injuries.py) since this is clinical data feeding directly
    into the injury risk score's "Historical Injury Factors" weight.
    """
    __tablename__ = "injury_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    athlete_profile_id = Column(UUID(as_uuid=True), ForeignKey("athlete_profiles.id"), nullable=False)

    body_part = Column(Enum(BodyPart), nullable=False)
    injury_type = Column(String, nullable=False)  # e.g. "ACL Tear", "Grade 2 Hamstring Strain"
    severity = Column(Enum(InjurySeverity), nullable=False)
    recovery_status = Column(Enum(RecoveryStatus), nullable=False, default=RecoveryStatus.active)

    date_occurred = Column(Date, nullable=False)
    expected_recovery_date = Column(Date, nullable=True)
    actual_recovery_date = Column(Date, nullable=True)

    notes = Column(Text, nullable=True)

    # Audit trail: who entered this record, and when. Required for any
    # clinical/health data — you must always be able to answer "who said this?"
    recorded_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    athlete_profile = relationship("AthleteProfile", back_populates="injury_records")

    __table_args__ = (
        Index("ix_injury_records_athlete_profile_id", "athlete_profile_id"),
    )


class PerformanceMetric(Base):
    """
    One row per performance test result (e.g. "40m Sprint Time: 5.2 seconds,
    recorded 2026-07-01"). Written by coach/sports_scientist/admin.
    """
    __tablename__ = "performance_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    athlete_profile_id = Column(UUID(as_uuid=True), ForeignKey("athlete_profiles.id"), nullable=False)

    metric_name = Column(String, nullable=False)   # e.g. "Vertical Jump", "40m Sprint"
    metric_value = Column(Float, nullable=False)
    unit = Column(String, nullable=False)           # e.g. "cm", "seconds", "kg"
    recorded_date = Column(Date, nullable=False)
    notes = Column(Text, nullable=True)

    recorded_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    athlete_profile = relationship("AthleteProfile", back_populates="performance_metrics")

    __table_args__ = (
        Index("ix_performance_metrics_athlete_profile_id", "athlete_profile_id"),
    )


class PhysicalAssessment(Base):
    """
    One row per periodic clinical/screening assessment
    (e.g. pre-season screening, return-to-play clearance).
    Written by physiotherapist/sports_scientist/admin.
    """
    __tablename__ = "physical_assessments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    athlete_profile_id = Column(UUID(as_uuid=True), ForeignKey("athlete_profiles.id"), nullable=False)

    assessment_type = Column(String, nullable=False)  # e.g. "Pre-season Screening", "Return-to-Play"
    assessment_date = Column(Date, nullable=False)
    findings = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    follow_up_required = Column(Boolean, default=False)

    assessor_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    athlete_profile = relationship("AthleteProfile", back_populates="physical_assessments")

    __table_args__ = (
        Index("ix_physical_assessments_athlete_profile_id", "athlete_profile_id"),
    )


class TrainingLoadEntry(Base):
    """
    One row per training session. `intensity_rpe` follows the standard sports-
    science "Rate of Perceived Exertion" scale (1-10), typically self-reported
    by the athlete right after a session, with the session logistics (type,
    duration) loggable by a coach.
    """
    __tablename__ = "training_load_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    athlete_profile_id = Column(UUID(as_uuid=True), ForeignKey("athlete_profiles.id"), nullable=False)

    session_date = Column(Date, nullable=False)
    session_type = Column(String, nullable=False)  # e.g. "Strength", "Conditioning", "Match", "Recovery"
    duration_minutes = Column(Integer, nullable=False)
    intensity_rpe = Column(Integer, nullable=True)  # 1-10 scale, nullable since coach-logged entries may omit it
    notes = Column(Text, nullable=True)

    recorded_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    athlete_profile = relationship("AthleteProfile", back_populates="training_load_entries")

    __table_args__ = (
        Index("ix_training_load_entries_athlete_profile_id", "athlete_profile_id"),
    )


class VideoStatus(str, enum.Enum):
    uploaded = "uploaded"        # file saved, processing not started yet
    processing = "processing"    # pose estimation running in the background
    completed = "completed"      # analysis finished successfully
    failed = "failed"            # processing errored out; see error_message


class ActivityType(str, enum.Enum):
    """Mirrors the BRD's 'Supported Activities' list."""
    running = "running"
    sprinting = "sprinting"
    jumping = "jumping"
    squatting = "squatting"
    landing = "landing"
    throwing = "throwing"
    cutting = "cutting"
    sport_specific_drill = "sport_specific_drill"
    other = "other"


class Video(Base):
    """
    One uploaded movement video and everything about its processing pipeline.
    Frame-by-frame pose data lives in VideoFrame; this table is metadata +
    status + the aggregate outcome of processing.
    """
    __tablename__ = "videos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    athlete_profile_id = Column(UUID(as_uuid=True), ForeignKey("athlete_profiles.id"), nullable=False)
    uploaded_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    activity_type = Column(Enum(ActivityType), nullable=False, default=ActivityType.other)
    original_filename = Column(String, nullable=False)
    storage_path = Column(String, nullable=False)            # raw uploaded file, on disk
    annotated_storage_path = Column(String, nullable=True)   # skeleton-overlay output video, once processed

    status = Column(Enum(VideoStatus), nullable=False, default=VideoStatus.uploaded)
    error_message = Column(Text, nullable=True)

    duration_seconds = Column(Float, nullable=True)
    fps = Column(Float, nullable=True)
    frame_count = Column(Integer, nullable=True)
    analyzed_frame_count = Column(Integer, nullable=True)  # frames where a pose was actually detected

    uploaded_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)

    athlete_profile = relationship("AthleteProfile", back_populates="videos")
    frames = relationship("VideoFrame", back_populates="video", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_videos_athlete_profile_id", "athlete_profile_id"),
    )


class VideoFrame(Base):
    """
    One row per analyzed video frame. Stores the raw 33-point MediaPipe
    landmark set (as JSON: each point has x, y, z, visibility) plus the
    joint angles we derive from it, so range-of-motion and symmetry can be
    computed later without re-running pose estimation.

    Storing one row per frame is fine for short clips (a 10s clip at 30fps is
    300 rows). For long-form video this would need downsampling or a proper
    time-series store (the original architecture doc flags InfluxDB/Timescale
    for exactly this) -- noted as a scaling concern, not solved here.
    """
    __tablename__ = "video_frames"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    video_id = Column(UUID(as_uuid=True), ForeignKey("videos.id"), nullable=False)

    frame_number = Column(Integer, nullable=False)
    timestamp_seconds = Column(Float, nullable=False)

    pose_detected = Column(Boolean, nullable=False, default=False)
    landmarks = Column(JSON, nullable=True)  # list of 33 {x,y,z,visibility} dicts, normalized 0-1

    left_knee_angle = Column(Float, nullable=True)
    right_knee_angle = Column(Float, nullable=True)
    left_hip_angle = Column(Float, nullable=True)
    right_hip_angle = Column(Float, nullable=True)
    left_elbow_angle = Column(Float, nullable=True)
    right_elbow_angle = Column(Float, nullable=True)
    trunk_lean_angle = Column(Float, nullable=True)  # degrees off vertical

    video = relationship("Video", back_populates="frames")

    __table_args__ = (
        Index("ix_video_frames_video_id", "video_id"),
    )
