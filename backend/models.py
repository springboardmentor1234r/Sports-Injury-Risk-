from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
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