import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional

from app import schemas, crud, auth, models
from app.database import get_db

router = APIRouter(prefix="/api/videos", tags=["Videos"])

# Define directory to save files
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=schemas.VideoResponse, status_code=status.HTTP_201_CREATED)
async def upload_video(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    dataset_source: Optional[str] = Form("custom"),
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "athlete":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only athletes can upload training videos."
        )
        
    athlete_profile = crud.get_athlete_by_user_id(db, user_id=current_user.id)
    if not athlete_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete profile not found. Please setup profile first."
        )
        
    # Generate unique filename to avoid conflict
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    dest_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save the file locally
    try:
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save file: {str(e)}"
        )
        
    # Create DB entry
    # Store path relative to backend root
    relative_path = f"uploads/{unique_filename}"
    video_create = schemas.VideoCreate(
        title=title,
        description=description,
        dataset_source=dataset_source,
        file_path=relative_path
    )
    
    db_video = crud.create_video_record(db=db, athlete_id=athlete_profile.id, video=video_create)
    return db_video

@router.get("", response_model=List[schemas.VideoResponse])
def get_videos(
    athlete_id: Optional[int] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    target_athlete_id = None
    
    if current_user.role == "athlete":
        athlete_profile = crud.get_athlete_by_user_id(db, user_id=current_user.id)
        if not athlete_profile:
            return []
        target_athlete_id = athlete_profile.id
    else:
        # Staff role filter
        if not athlete_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="athlete_id is required for staff query."
            )
        target_athlete_id = athlete_id
        
    return crud.get_athlete_videos(db=db, athlete_id=target_athlete_id)
