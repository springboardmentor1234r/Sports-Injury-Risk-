from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .base import Base

class Athlete(Base):
    __tablename__ = "athletes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    age = Column(Integer)
    height = Column(Float) # in cm
    weight = Column(Float) # in kg
    gender = Column(String)
    sport = Column(String)
    position = Column(String)
    training_load = Column(String)
    previous_injuries = Column(JSON, default=list)
    
    user = relationship("User", backref="athlete_profile")
