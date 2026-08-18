from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import Optional
from app.models.session import Session
from datetime import datetime, timedelta
from app.config import settings

async def create_session(db: AsyncSession, user_id: int, expires_minutes: int = None) -> Session:
    expires = None
    if expires_minutes is None:
        expires_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
    expires = datetime.utcnow() + timedelta(minutes=expires_minutes)
    session = Session(user_id=user_id, expires_at=expires)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session

async def get_session_by_token(db: AsyncSession, token: str) -> Optional[Session]:
    result = await db.execute(select(Session).filter(Session.token == token))
    return result.scalars().first()

async def delete_session_by_token(db: AsyncSession, token: str):
    await db.execute(delete(Session).where(Session.token == token))
    await db.commit()
