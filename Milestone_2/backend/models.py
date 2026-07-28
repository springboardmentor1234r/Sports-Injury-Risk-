from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, JSON
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(100), unique=True, index=True)
    password = Column(String(255))
    role = Column(String(50), default="athlete")
    created_at = Column(DateTime, server_default=func.now())

class Athlete(Base):
    __tablename__ = "athletes"
    athlete_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    sport = Column(String(100))
    position = Column(String(100))
    age = Column(Integer)
    height = Column(Float)
    weight = Column(Float)
    injury_history = Column(Text)
    training_load = Column(String(100))

# ---- Milestone 2: Video Upload, Pose Estimation, Biomechanical Analysis ----

class Video(Base):
    __tablename__ = "videos"
    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("athletes.athlete_id"))
    filename = Column(String(255))
    file_path = Column(String(500))
    activity_type = Column(String(50))
    status = Column(String(20), default="uploaded")  # uploaded | processing | completed | failed
    duration_seconds = Column(Float, nullable=True)
    fps = Column(Float, nullable=True)
    total_frames = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, server_default=func.now())

class PoseFrame(Base):
    __tablename__ = "pose_frames"
    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"))
    frame_number = Column(Integer)
    timestamp_ms = Column(Float)
    keypoints = Column(JSON)       # {"left_knee": {"x":..,"y":..,"z":..,"visibility":..}, ...}
    joint_angles = Column(JSON, nullable=True)  # {"left_knee": 172.3, ...}

class BiomechanicsReport(Base):
    __tablename__ = "biomechanics_reports"
    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), unique=True)
    avg_knee_valgus_left = Column(Float, nullable=True)
    avg_knee_valgus_right = Column(Float, nullable=True)
    knee_valgus_asymmetry = Column(Float, nullable=True)
    avg_trunk_lean = Column(Float, nullable=True)
    movement_symmetry_score = Column(Float, nullable=True)
    movement_quality_score = Column(Float, nullable=True)
    rom_summary = Column(JSON, nullable=True)
    generated_at = Column(DateTime, server_default=func.now())

# ---- Role-based access: which staff member (coach/physio/sports scientist)
# is allowed to view which athlete ----

class AthleteAssignment(Base):
    __tablename__ = "athlete_assignments"
    id = Column(Integer, primary_key=True, index=True)
    staff_user_id = Column(Integer, ForeignKey("users.id"))       # coach / physiotherapist / sports_scientist
    athlete_id = Column(Integer, ForeignKey("athletes.athlete_id"))
    assigned_at = Column(DateTime, server_default=func.now())