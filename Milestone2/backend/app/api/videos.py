from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from app.services.video_service import (
    save_uploaded_video,
    get_video_metadata,
    list_all_videos,
    VALID_MOVEMENTS
)
from app.models.sql_models import User
from app.core.rbac import get_optional_current_user

router = APIRouter(prefix="/videos", tags=["Video Processing Engine"])

@router.post("/upload", status_code=status.HTTP_201_CREATED)
def upload_video(
    file: UploadFile = File(...),
    movement_type: str = Form(...),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Ingest dynamic movement video (.mp4, .avi, .mov), extract OpenCV metadata,
    and persist document into MongoDB 'video_metadata' collection.
    """
    user_email = current_user.email if current_user else "athlete@sportsmed.io"
    metadata = save_uploaded_video(
        file=file,
        movement_type=movement_type,
        user_email=user_email
    )
    return {
        "status": "success",
        "message": "Video uploaded and metadata extracted successfully.",
        "video": metadata
    }

@router.get("", status_code=status.HTTP_200_OK)
def get_videos(current_user: Optional[User] = Depends(get_optional_current_user)):
    """Retrieve all uploaded video metadata payload records from MongoDB."""
    videos = list_all_videos()
    return {
        "count": len(videos),
        "videos": videos
    }

@router.get("/{video_id}", status_code=status.HTTP_200_OK)
def get_video_by_id(video_id: str, current_user: Optional[User] = Depends(get_optional_current_user)):
    """Retrieve video metadata document by video_id."""
    video = get_video_metadata(video_id)
    return video
