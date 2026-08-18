from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db

router = APIRouter()

@router.get("/")
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    return {"status": "ok"}
