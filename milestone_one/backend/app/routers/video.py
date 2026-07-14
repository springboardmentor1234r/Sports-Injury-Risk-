import asyncio
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form, BackgroundTasks
from typing import List

from app.database import get_db
from app.services.auth_service import get_current_user
from app.core.storage import save_video
from app.models.user import UserDoc
from app.models.video import VideoDoc, VideoStatus
from app.schemas.video import VideoResponse

router = APIRouter(prefix="/videos", tags=["Videos"])

async def start_dl_pipeline(video_id: str):
    """
    Placeholder background task simulating the ML processing pipeline.
    Updates status to 'preprocessing' to verify the trigger trigger logic works.
    """
    db = get_db()
    # Simulate setup delay
    await asyncio.sleep(2)
    await db.videos.update_one(
        {"id": video_id},
        {"$set": {"status": VideoStatus.PREPROCESSING}}
    )

@router.post("/upload", response_model=VideoResponse, status_code=status.HTTP_201_CREATED)
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    athlete_id: str = Form(...),
    current_user: UserDoc = Depends(get_current_user)
):
    db = get_db()
    
    # 1. Verify the athlete exists in MongoDB
    athlete_exists = await db.athletes.find_one({"id": athlete_id})
    if not athlete_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete profile not found"
        )
        
    # 2. Write file to disk and validate
    saved_path = save_video(file, athlete_id)
    
    # 3. Save metadata record to MongoDB
    video_doc = VideoDoc(
        athlete_id=athlete_id,
        filename=file.filename,
        file_path=saved_path,
        status=VideoStatus.UPLOADED
    )
    await db.videos.insert_one(video_doc.model_dump())
    
    # 4. Trigger DL Pipeline placeholder task in background
    background_tasks.add_task(start_dl_pipeline, video_doc.id)
    
    return video_doc

@router.get("/{video_id}", response_model=VideoResponse)
async def get_video(video_id: str, current_user: UserDoc = Depends(get_current_user)):
    db = get_db()
    video_dict = await db.videos.find_one({"id": video_id})
    if not video_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video record not found"
        )
    return VideoDoc(**video_dict)

@router.get("/athlete/{athlete_id}", response_model=List[VideoResponse])
async def list_athlete_videos(athlete_id: str, current_user: UserDoc = Depends(get_current_user)):
    db = get_db()
    cursor = db.videos.find({"athlete_id": athlete_id})
    videos = []
    async for doc in cursor:
        videos.append(VideoDoc(**doc))
    return videos
