import os

from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi import Depends
from sqlalchemy.orm import Session

from datetime import datetime

from app.database.database import get_db
from app.models.video import Video
from app.schemas.video import VideoResponse

from app.services.video_processing import (
    extract_video_metadata,
    extract_frames,
    preprocess_frames,
    validate_video
)

router = APIRouter(
    prefix="/videos",
    tags=["Video Processing"]
)

UPLOAD_FOLDER = "uploads"
FRAME_FOLDER = "frames"
PROCESSED_FOLDER = "processed_frames"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(FRAME_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)


@router.post("/upload", response_model=VideoResponse)
def upload_video(
    athlete_id: int = Query(...),
    video: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    file_path = os.path.join(
        UPLOAD_FOLDER,
        video.filename
    )

    with open(file_path, "wb") as buffer:
        buffer.write(video.file.read())

    validation = validate_video(file_path)

    if not validation["valid"]:

        os.remove(file_path)

        raise HTTPException(
            status_code=400,
            detail=validation["message"]
        )

    metadata = extract_video_metadata(file_path)

    new_video = Video(
        athlete_id=athlete_id,
        file_name=video.filename,
        file_path=file_path,
        status="Uploaded",
        fps=metadata["fps"],
        total_frames=metadata["total_frames"],
        duration=metadata["duration"],
        width=metadata["width"],
        height=metadata["height"],
        resolution=metadata["resolution"],
        uploaded_at=datetime.now()
    )

    db.add(new_video)
    db.commit()
    db.refresh(new_video)

    frame_folder = os.path.join(
        FRAME_FOLDER,
        f"video_{new_video.id}"
    )

    extract_frames(
        file_path,
        frame_folder
    )

    processed_folder = os.path.join(
        PROCESSED_FOLDER,
        f"video_{new_video.id}"
    )

    preprocess_frames(
        frame_folder,
        processed_folder
    )

    return new_video