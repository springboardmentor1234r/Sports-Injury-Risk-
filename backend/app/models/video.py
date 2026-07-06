from sqlalchemy import Column, Integer, String, DateTime, Float
from sqlalchemy.sql import func

from app.database.database import Base


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)

    athlete_id = Column(Integer, nullable=False)

    file_name = Column(String, nullable=False)

    file_path = Column(String, nullable=False)

    status = Column(String, default="Uploaded")

    fps = Column(Float, nullable=True)

    total_frames = Column(Integer, nullable=True)

    duration = Column(Float, nullable=True)

    width = Column(Integer, nullable=True)

    height = Column(Integer, nullable=True)

    resolution = Column(String, nullable=True)

    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())