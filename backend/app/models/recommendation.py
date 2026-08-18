from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id"))
    exercise_type = Column(String, nullable=False)
    description = Column(String, nullable=False)
    priority = Column(Integer, default=1)
    
    prediction = relationship("InjuryPrediction", backref="recommendations")
