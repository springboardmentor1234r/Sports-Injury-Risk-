import os
import shutil
from uuid import uuid4
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from typing import List

# Models & Schemas

from app.models.user import User
from app.schemas.video import VideoMetadataOut
from app.models.video import VideoMetadata
from app.models.analysis import AnalysisResult
from app.api.deps import get_current_user

# AI Services
from app.services.ai_engine.pose import process_video_pose

# Define the router
router = APIRouter()

UPLOAD_DIR = "uploads"
# Ensure the upload directory exists
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/upload",response_model=VideoMetadataOut)
async def upload_video(
    activity_type: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Step 1: Upload the raw video file and save metadata.
    """
    if not file.filename.endswith((".mp4", ".mov", ".avi")):
        raise HTTPException(status_code=400, detail="Invalid video format")

    unique_filename = f"{uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    video_record = VideoMetadata(
        athlete_id=str(current_user.id),
        filename=file.filename,
        file_path=file_path,
        activity_type=activity_type,
        status="pending"
    )
    await video_record.insert()

    return {
        "id": str(video_record.id),
        "athlete_id": str(video_record.athlete_id),
        "filename": video_record.filename,
        "upload_date": video_record.upload_date,
        "status": video_record.status,
        "activity_type": video_record.activity_type,
    }

@router.post("/{video_id}/analyze")
async def analyze_video(
    video_id: str, 
    current_user: User = Depends(get_current_user)
):
    """
    Step 2: Trigger the MediaPipe AI to extract coordinates.
    """
    # 1. Fetch video metadata from Atlas
    video = await VideoMetadata.get(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # 2. Update status to 'processing'
    await video.set({"status": "processing"})

    try:
        # 3. Run MediaPipe Pose Estimation
        frames_data = await process_video_pose(video.file_path)

        # 4. Save results to analysis_results collection
        analysis = AnalysisResult(
            video_id=str(video.id),
            athlete_id=str(current_user.id),
            activity_type=video.activity_type,
            frames_data=frames_data
        )
        await analysis.insert()

        # 5. Finalize status
        await video.set({"status": "completed"})

        return {
            "message": "Analysis complete",
            "analysis_id": str(analysis.id),
            "total_frames_processed": len(frames_data)
        }
        
    except RuntimeError as exc:
        await video.set({"status": "failed"})
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI processing unavailable: {str(exc)}",
        ) from exc

    except Exception as exc:
        await video.set({"status": "failed"})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI processing failed: {str(exc)}",
        ) from exc

@router.get("/results/{video_id}")
async def get_analysis_results(
    video_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Step 3: Retrieve the raw coordinate data.
    """
    result = await AnalysisResult.find_one(AnalysisResult.video_id == video_id)
    if not result:
        raise HTTPException(status_code=404, detail="Analysis results not found")
    return result