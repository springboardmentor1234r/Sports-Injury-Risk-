from sqlalchemy import Column, Integer, String, Float
from database import Base

class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    age = Column(Integer)
    height = Column(Float)
    weight = Column(Float)
    sport = Column(String)