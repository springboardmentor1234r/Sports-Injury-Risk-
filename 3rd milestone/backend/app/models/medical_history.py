from sqlalchemy import Column, Integer, String, ForeignKey, Date
from sqlalchemy.orm import relationship
from .base import Base

class MedicalHistory(Base):
    __tablename__ = "medical_histories"
    
    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id"))
    injury_type = Column(String, nullable=False)
    date_of_injury = Column(Date, nullable=False)
    recovery_status = Column(String)
    notes = Column(String)
    
    athlete = relationship("Athlete", backref="medical_history")
