import os
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.database import get_db
from app.routers.auth import get_current_user
from app.milestone2.models.pose import PoseAnalysisDB
from app.milestone2.schemas.pose import PoseAnalysisOut, PoseAnalysisStatusResponse
from app.milestone2.services.pose_service import PoseEstimationService

router = APIRouter(prefix="/milestone2/pose", tags=["Milestone 2 - Pose Estimation"])

@router.post("/process/{video_id}", response_model=PoseAnalysisOut, status_code=status.HTTP_202_ACCEPTED)
async def start_pose_processing(
    video_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Triggers the MediaPipe Pose Estimation pipeline for a given uploaded Video ID.
    Only Coaches, Admins, or authorized Operators are allowed to initialize processing.
    """
    # 1. Access Controls
    role = current_user.get("role")
    if role not in ["Coach", "Admin", "Physiotherapist", "Sports Scientist"]:
         # Athlete can only trigger if the video belongs to them
         # First resolve the video
         pass
    
    # 2. Check if video exists
    try:
        video_doc = await db["Videos"].find_one({"_id": ObjectId(video_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Video ID format."
        )

    if not video_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video record not found."
        )

    # Resolve Athlete owner permission check for Athlete role
    if role == "Athlete":
        athlete_doc = await db["athletes"].find_one({"_id": ObjectId(video_doc["athlete_id"])})
        if not athlete_doc or athlete_doc.get("full_name", "").lower() != current_user.get("name", "").lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only run pose analysis on your own videos."
            )

    # 3. Check corresponding session
    session_doc = await db["AnalysisSessions"].find_one({"video_id": video_id})
    session_id = str(session_doc["_id"]) if session_doc else "Unknown"

    # 4. Check if PoseAnalysis already exists to prevent duplicate processing
    existing_pose = await db["PoseAnalysis"].find_one({"video_id": video_id})
    if existing_pose:
        # If it failed or is completed, we can overwrite or return it
        if existing_pose.get("processing_status") in ["processing", "completed"]:
            existing_pose["_id"] = str(existing_pose["_id"])
            return existing_pose
        else:
            # Delete failed runs to retry
            await db["PoseAnalysis"].delete_one({"_id": existing_pose["_id"]})

    # 5. Insert new PoseAnalysis document
    pose_obj = PoseAnalysisDB(
        video_id=video_id,
        session_id=session_id,
        processing_status="processing"
    )
    pose_dict = pose_obj.model_dump(by_alias=True)
    if "_id" in pose_dict and pose_dict["_id"] is None:
        del pose_dict["_id"]

    insert_result = await db["PoseAnalysis"].insert_one(pose_dict)
    analysis_id = str(insert_result.inserted_id)
    pose_dict["_id"] = analysis_id

    # 6. Spawn Background Task
    video_path = os.path.join("uploads", video_doc["stored_filename"])
    background_tasks.add_task(
        PoseEstimationService.process_video_pose,
        analysis_id,
        video_path,
        db
    )

    return pose_dict

@router.get("/status/{id}", response_model=PoseAnalysisStatusResponse)
async def get_pose_status(
    id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Check the active processing status (completed, failed, processing) of an analysis task.
    """
    try:
        pose_doc = await db["PoseAnalysis"].find_one({"_id": ObjectId(id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid analysis ID format."
        )

    if not pose_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pose analysis task not found."
        )

    # Read frame length to calculate progress metrics
    frames = pose_doc.get("frames", [])
    frames_processed = len(frames)
    
    # Try reading the video total frame count
    total_frames = frames_processed
    video_doc = await db["Videos"].find_one({"_id": ObjectId(pose_doc["video_id"])})
    if video_doc:
        # Check if duration and FPS are available to estimate total frame count
        fps = video_doc.get("fps", 0)
        duration = video_doc.get("duration", 0)
        if fps > 0 and duration > 0:
            total_frames = int(fps * duration)

    return {
        "id": str(pose_doc["_id"]),
        "video_id": pose_doc["video_id"],
        "session_id": pose_doc["session_id"],
        "processing_status": pose_doc["processing_status"],
        "error_message": pose_doc.get("error_message"),
        "frames_processed": frames_processed,
        "total_frames": max(frames_processed, total_frames)
    }

@router.get("/results/{id}", response_model=PoseAnalysisOut)
async def get_pose_results(
    id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Fetch the complete frame-by-frame landmarks coordinate arrays for rendering.
    """
    try:
        pose_doc = await db["PoseAnalysis"].find_one({"_id": ObjectId(id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid analysis ID format."
        )

    if not pose_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pose analysis results not found."
        )

    pose_doc["_id"] = str(pose_doc["_id"])
    return pose_doc

@router.get("/video/{video_id}", response_model=PoseAnalysisOut)
async def get_pose_by_video_id(
    video_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get pose analysis results associated with a specific Video ID.
    """
    pose_doc = await db["PoseAnalysis"].find_one({"video_id": video_id})
    if not pose_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pose analysis found for this video."
        )

    pose_doc["_id"] = str(pose_doc["_id"])
    return pose_doc

@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_pose_analysis(
    id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Delete a pose analysis run. Clears pose references in AnalysisSessions.
    """
    role = current_user.get("role")
    if role not in ["Coach", "Admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Coaches or Admins are permitted to delete analysis sessions."
        )

    try:
        result = await db["PoseAnalysis"].delete_one({"_id": ObjectId(id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format."
        )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pose analysis record not found."
        )

    # Clean sessions record references
    await db["AnalysisSessions"].update_many(
        {"pose_analysis_id": id},
        {"$set": {"pose_analysis_id": None}}
    )

    return {"message": "Pose analysis data successfully deleted."}
