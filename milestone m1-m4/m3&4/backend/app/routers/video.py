import os
import uuid
import shutil
import logging
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional

from app import schemas, crud, auth, models
from app.database import get_db

router = APIRouter(prefix="/api/videos", tags=["Videos"])
logger = logging.getLogger(__name__)

# Define directory to save files
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def process_pose_estimation_task(video_id: int, dest_path: str):
    """
    Background worker function that extracts skeletal landmarks and calculates biomechanics.
    Updates the Video database record once calculations finish.
    """
    from app.database import SessionLocal
    from app.services.pose_estimator import PoseEstimatorService
    from app.services.analytics import BiomechanicalAnalytics
    from app.models import Video
    
    db = SessionLocal()
    try:
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            return
            
        video.status = "processing"
        db.commit()
        
        # Build target processed output file path (draw overlay frames)
        dir_name = os.path.dirname(dest_path)
        base_name = os.path.basename(dest_path)
        processed_filename = f"processed_{base_name}"
        processed_path = os.path.join(dir_name, processed_filename)
        processed_relative = f"uploads/{processed_filename}"
        
        # Run pose tracking service
        skeletal_data, score, summary = PoseEstimatorService.process_video(
            dest_path, processed_path, video.dataset_source
        )
        
        # Write results to db
        video.status = "analyzed"
        video.file_path = processed_relative
        video.skeletal_data = skeletal_data
        video.movement_score = score
        video.analysis_summary = summary
        db.commit()
        # Persist an explainable assessment only after the existing pose pipeline succeeds.
        from app.services.intelligence import AthleteIntelligenceService
        AthleteIntelligenceService.build_assessment(db, video.athlete_id, persist=True, video=video)
        logger.info("Video analysis and intelligence assessment completed for video_id=%s", video_id)
    except Exception as e:
        logger.exception("Video processing failed for video_id=%s", video_id)
        if 'video' in locals() and video:
            video.status = "failed"
            db.commit()
    finally:
        db.close()

@router.post("/upload", response_model=schemas.VideoResponse, status_code=status.HTTP_201_CREATED)
async def upload_video(
    background_tasks: BackgroundTasks,
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
    
    # Trigger background MediaPipe pose analysis
    background_tasks.add_task(process_pose_estimation_task, db_video.id, dest_path)
    
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

@router.delete("/{video_id}", status_code=status.HTTP_200_OK)
def delete_video(
    video_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    video = db.query(models.Video).filter(models.Video.id == video_id).first()
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video record not found."
        )

    # Permission check: Athletes can only delete their own clips
    if current_user.role == "athlete":
        athlete_profile = crud.get_athlete_by_user_id(db, user_id=current_user.id)
        if not athlete_profile or video.athlete_id != athlete_profile.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Cannot delete this video."
            )

    # Physical files removal (graceful handling if file is already missing)
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    candidates = []
    
    if video.file_path:
        clean_p = video.file_path.replace("\\", "/").lstrip("/")
        candidates.append(os.path.join(backend_dir, clean_p))
        if "processed_" in clean_p:
            orig_p = clean_p.replace("processed_", "")
            candidates.append(os.path.join(backend_dir, orig_p))

    for p in candidates:
        try:
            if os.path.exists(p) and os.path.isfile(p):
                os.remove(p)
        except Exception as e:
            print(f"[WARNING] Could not delete physical file {p}: {e}", flush=True)

    # Delete database record
    crud.delete_video_record(db, video_id=video_id)
    return {"message": "Video deleted successfully.", "id": video_id}
