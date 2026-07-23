import os
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.database import get_db
from app.routers.auth import get_current_user
from app.milestone2.schemas.biomechanics import AnalysisStatusResponse, BiomechanicsOut
from app.milestone2.schemas.skeleton import SkeletonTrackingOut
from app.milestone2.services.analysis_service import BiomechanicalAnalysisService
from app.milestone2.models.pose import PoseAnalysisDB
from app.milestone2.services.pose_service import PoseEstimationService

router = APIRouter(prefix="/milestone2/analysis", tags=["Milestone 2 - Biomechanical Analysis"])

@router.post("/start/{video_id}", response_model=AnalysisStatusResponse, status_code=status.HTTP_202_ACCEPTED)
async def start_analysis(
    video_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Launch the full tracking and biomechanics extraction pipeline for a video.
    Operates asynchronously in the background.
    """
    # 1. Verify video exists
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

    # 2. Check or create parent session document
    session_doc = await db["AnalysisSessions"].find_one({"video_id": video_id})
    if not session_doc:
        # Create one if missing
        session_id_obj = await db["AnalysisSessions"].insert_one({
            "athlete_id": video_doc["athlete_id"],
            "session_name": f"{video_doc['activity']} Analysis - {datetime.now(timezone.utc).strftime('%Y-%m-%d')}",
            "activity_type": video_doc["activity"],
            "video_id": video_id,
            "pose_analysis_id": None,
            "skeleton_tracking_id": None,
            "biomechanics_id": None,
            "processing_status": "processing",
            "created_at": datetime.now(timezone.utc),
            "created_by": current_user.get("email")
        })
        session_id = str(session_id_obj.inserted_id)
    else:
        session_id = str(session_doc["_id"])

    # Update session status to processing
    await db["AnalysisSessions"].update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {"processing_status": "processing", "error_message": None}}
    )

    # 3. Trigger analysis pipeline in background.
    # If PoseAnalysis doesn't exist, we must start with Pose Estimation (which chains to Biomechanics)
    pose_doc = await db["PoseAnalysis"].find_one({"video_id": video_id})
    if not pose_doc:
        # Generate new PoseAnalysis document
        pose_obj = PoseAnalysisDB(
            video_id=video_id,
            session_id=session_id,
            processing_status="processing"
        )
        pose_dict = pose_obj.model_dump(by_alias=True)
        if "_id" in pose_dict and pose_dict["_id"] is None:
            del pose_dict["_id"]
        pose_insert = await db["PoseAnalysis"].insert_one(pose_dict)
        pose_id = str(pose_insert.inserted_id)

        # Update Session with pose analysis ID
        await db["AnalysisSessions"].update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {"pose_analysis_id": pose_id}}
        )
        
        # Trigger Pose Ingestion background tasks (which chains into Biomechanics!)
        background_tasks.add_task(
            PoseEstimationService.process_video_pose,
            pose_id,
            os.path.join("uploads", video_doc["stored_filename"]),
            db
        )
    else:
        # Pose coords exist. Trigger analysis pipeline directly.
        background_tasks.add_task(
            BiomechanicalAnalysisService.run_full_analysis,
            session_id,
            video_id,
            db
        )

    return {
        "session_id": session_id,
        "video_id": video_id,
        "processing_status": "processing",
        "progress": 0
    }

@router.get("/status/{session_id}", response_model=AnalysisStatusResponse)
async def get_analysis_status(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get the processing progress status of a session analysis run.
    """
    try:
        session = await db["AnalysisSessions"].find_one({"_id": ObjectId(session_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Session ID format."
        )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis session not found."
        )

    status_val = session.get("processing_status", "idle")
    progress = 0
    
    if status_val == "completed":
        progress = 100
    elif status_val == "processing":
        # Check if we have tracking and biomechanics counts compared to pose count
        pose_doc = await db["PoseAnalysis"].find_one({"video_id": session["video_id"]})
        if pose_doc:
            pose_len = len(pose_doc.get("frames", []))
            
            # Read progress from current biomechanics doc length
            biomech_doc = await db["Biomechanics"].find_one({"session_id": session_id})
            if biomech_doc and pose_len > 0:
                progress = round((len(biomech_doc.get("frames", [])) / pose_len) * 100)
                progress = min(progress, 99)
            else:
                progress = 20  # skeleton tracking stage
        else:
            progress = 5
            
    return {
        "session_id": session_id,
        "video_id": session["video_id"],
        "processing_status": status_val,
        "error_message": session.get("error_message"),
        "progress": progress
    }

@router.get("/results/{session_id}", response_model=BiomechanicsOut)
async def get_analysis_results(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get the completed frame-by-frame biomechanics telemetry and summary aggregates.
    """
    try:
        biomech_doc = await db["Biomechanics"].find_one({"session_id": session_id})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Session ID format."
        )

    if not biomech_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Biomechanics analysis results not found."
        )

    biomech_doc["_id"] = str(biomech_doc["_id"])
    return biomech_doc

@router.get("/skeleton/{video_id}", response_model=SkeletonTrackingOut)
async def get_skeleton_by_video_id(
    video_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get the joint motion tracking trail vectors for rendering overlays.
    """
    track_doc = await db["SkeletonTracking"].find_one({"video_id": video_id})
    if not track_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No skeleton tracking data found for this video."
        )

    track_doc["_id"] = str(track_doc["_id"])
    return track_doc

@router.get("/biomechanics/{video_id}", response_model=BiomechanicsOut)
async def get_biomechanics_by_video_id(
    video_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get biomechanics results associated with a specific Video ID.
    """
    biomech_doc = await db["Biomechanics"].find_one({"video_id": video_id})
    if not biomech_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No biomechanics analysis data found for this video."
        )

    biomech_doc["_id"] = str(biomech_doc["_id"])
    return biomech_doc

@router.get("/status-by-video/{video_id}", response_model=AnalysisStatusResponse)
async def get_analysis_status_by_video(
    video_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Fetch the analysis session status using a Video ID.
    """
    session_doc = await db["AnalysisSessions"].find_one({"video_id": video_id})
    if not session_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis session not found for this video."
        )
    
    progress = 0
    if session_doc.get("processing_status") == "completed":
        progress = 100
    elif session_doc.get("processing_status") == "processing":
        # Check if pose estimation has processed frames to calculate progress
        pose_doc = await db["PoseAnalysis"].find_one({"video_id": video_id})
        if pose_doc and pose_doc.get("frames"):
            progress = 50
            
    return {
        "session_id": str(session_doc["_id"]),
        "video_id": video_id,
        "processing_status": session_doc.get("processing_status", "idle"),
        "progress": progress,
        "error_message": session_doc.get("error_message")
    }

@router.delete("/{session_id}", status_code=status.HTTP_200_OK)
async def delete_analysis(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Permanently delete all calculation logs (skeleton and biomechanics) for a session.
    """
    role = current_user.get("role")
    if role not in ["Coach", "Admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Coaches or Admins are permitted to delete analysis runs."
        )

    try:
        # Delete from collections
        await db["SkeletonTracking"].delete_many({"session_id": session_id})
        await db["Biomechanics"].delete_many({"session_id": session_id})
        
        # Reset parent session fields
        await db["AnalysisSessions"].update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {
                "skeleton_tracking_id": None,
                "biomechanics_id": None,
                "processing_status": "idle",
                "error_message": None
            }}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Deletion failure: {str(e)}"
        )

    return {"message": "Biomechanical analysis logs successfully deleted."}
