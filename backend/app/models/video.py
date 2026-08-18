from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, JSON
import enum
from sqlalchemy.orm import relationship
from .base import Base

class VideoStatus(str, enum.Enum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class Video(Base):
    __tablename__ = "videos"
    
    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id"))
    file_path = Column(String, nullable=False)
    s3_key = Column(String)
    format = Column(String)
    duration = Column(Float)
    fps = Column(Float)
    resolution = Column(String)
    status = Column(Enum(VideoStatus), default=VideoStatus.UPLOADED)
    metadata_info = Column(JSON, default=dict)
    
    athlete = relationship("Athlete", backref="videos")
