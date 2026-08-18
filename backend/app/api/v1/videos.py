from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.video import VideoCreate, VideoResponse
from app.services.video_service import video_service
from app.core.auth import get_current_user
from app.models.user import User
import shutil
import os

router = APIRouter()

@router.post("/upload", response_model=VideoResponse)
async def upload_video(
    athlete_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    video_in = VideoCreate(
        athlete_id=athlete_id,
        file_path=file_path,
        format=file.content_type
    )
    return await video_service.create_video(db, video_in)
