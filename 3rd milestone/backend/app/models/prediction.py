from sqlalchemy import Column, Integer, Float, ForeignKey, Enum, JSON
import enum
from sqlalchemy.orm import relationship
from .base import Base

class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class InjuryPrediction(Base):
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("video_analyses.id"))
    athlete_id = Column(Integer, ForeignKey("athletes.id"))
    risk_level = Column(Enum(RiskLevel), nullable=False)
    risk_score = Column(Float, nullable=False)
    contributing_factors = Column(JSON, default=list)
    
    analysis = relationship("VideoAnalysis", backref="prediction")
    athlete = relationship("Athlete", backref="predictions")
