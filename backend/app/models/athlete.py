from sqlalchemy import Column, Integer, String, Float
from app.database.database import Base


class Athlete(Base):
    __tablename__ = "athletes"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String, index=True)
    age = Column(Integer)
    gender = Column(String)

    # Sports Information
    sport = Column(String)
    position = Column(String)

    # Physical Information
    height = Column(Float)
    weight = Column(Float)

    # Injury Information
    injury_history = Column(String)

    # Training Information
    training_load = Column(String)

    # Performance Information
    performance_score = Column(Float)

    # Assessment Information
    physical_assessment = Column(String)