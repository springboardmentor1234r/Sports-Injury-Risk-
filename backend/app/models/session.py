from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime
import uuid
from .base import Base

class Session(Base):
    __tablename__ = 'sessions'

    token = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
