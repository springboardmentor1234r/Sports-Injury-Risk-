import os
from datetime import datetime, timezone
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.database import get_db
from app.routers.auth import get_current_user
from app.milestone2.models.video import VideoDB
from app.milestone2.models.pose import PoseAnalysisDB
from app.milestone2.schemas.video import VideoOut, VideoListResponse
from app.milestone2.services.pose_service import PoseEstimationService
from app.milestone2.services.video_service import (
    validate_and_save_video,
    extract_video_metadata,
    UPLOAD_DIR
)

router = APIRouter(prefix="/milestone2/videos", tags=["Milestone 2 - Video Upload"])

@router.post("/upload", response_model=VideoOut, status_code=status.HTTP_201_CREATED)
async def upload_video(
    background_tasks: BackgroundTasks,
    athlete_id: str = Form(...),
    activity: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Secure endpoint to upload an athlete's video file.
    Only allows uploads if user is Coach/Admin/Physio/Scientist, or if an Athlete is uploading for themselves.
    """
    # 1. Enforce Role-Based Access Controls (RBAC)
    role = current_user.get("role")
    user_name = current_user.get("name")
    
    # If the user is an Athlete, they can only upload videos for their own profile
    if role == "Athlete":
        # Resolve athlete document to make sure full_name matches current_user name
        try:
            ath_doc = await db["athletes"].find_one({"_id": ObjectId(athlete_id)})
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Athlete database ID."
            )
        if not ath_doc or ath_doc.get("full_name", "").lower() != user_name.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation rejected. Athletes can only upload videos for their own profile."
            )
            
    # 2. Save file locally & validate sizes
    stored_filename, file_path, file_size = validate_and_save_video(file)
    
    # 3. Extract metadata and run OpenCV corruption checks
    try:
        meta = extract_video_metadata(file_path)
    except HTTPException:
        # Clean up already saved file if metadata extraction raises corruption errors
        if os.path.exists(file_path):
            os.remove(file_path)
        raise
        
    # 4. Generate unique business video ID
    vid_num = str(uuid.uuid4().hex[:6]).upper()
    video_id = f"VID-{vid_num}"
    
    # 5. Create database documents
    video_doc = VideoDB(
        video_id=video_id,
        athlete_id=athlete_id,
        uploaded_by=current_user.get("email"),
        activity=activity,
        original_filename=file.filename,
        stored_filename=stored_filename,
        file_size=file_size,
        duration=meta["duration"],
        resolution=meta["resolution"],
        fps=meta["fps"],
        status="processing"
    )
    
    video_dict = video_doc.model_dump(by_alias=True)
    if "_id" in video_dict and video_dict["_id"] is None:
        del video_dict["_id"]
        
    try:
        # Insert into Videos collection
        insert_result = await db["Videos"].insert_one(video_dict)
        video_id_str = str(insert_result.inserted_id)
        video_dict["_id"] = video_id_str
        
        print(f"[PIPELINE LOG] Video uploaded: {file.filename}")
        print(f"[PIPELINE LOG] Video metadata extracted: FPS={meta['fps']}, Resolution={meta['resolution']}")

        # Initialize an AnalysisSessions parent document
        session_dict = {
            "athlete_id": athlete_id,
            "session_name": f"{activity} Analysis - {datetime.now(timezone.utc).strftime('%Y-%m-%d')}",
            "activity_type": activity,
            "video_id": video_id_str,
            "pose_analysis_id": None,
            "skeleton_tracking_id": None,
            "biomechanics_id": None,
            "processing_status": "processing",
            "created_at": datetime.now(timezone.utc),
            "created_by": current_user.get("email")
        }
        session_res = await db["AnalysisSessions"].insert_one(session_dict)
        session_id_str = str(session_res.inserted_id)

        # Create PoseAnalysis document
        pose_obj = PoseAnalysisDB(
            video_id=video_id_str,
            session_id=session_id_str,
            processing_status="processing"
        )
        pose_dict = pose_obj.model_dump(by_alias=True)
        if "_id" in pose_dict and pose_dict["_id"] is None:
            del pose_dict["_id"]
        pose_insert = await db["PoseAnalysis"].insert_one(pose_dict)
        analysis_id = str(pose_insert.inserted_id)

        # Update Session with pose analysis ID
        await db["AnalysisSessions"].update_one(
            {"_id": ObjectId(session_id_str)},
            {"$set": {"pose_analysis_id": analysis_id}}
        )

        print(f"[PIPELINE LOG] Pose estimation started automatically for video: {video_id_str}")

        # Trigger background processing
        background_tasks.add_task(
            PoseEstimationService.process_video_pose,
            analysis_id,
            file_path,
            db
        )
        
    except Exception as e:
        # Clean up file in case of DB insert crash
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database write failure: {str(e)}"
        )
        
    return video_dict

@router.get("", response_model=VideoListResponse)
async def list_videos(
    athlete_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Fetch listing of uploaded videos.
    Athletes can only view their own uploads.
    """
    role = current_user.get("role")
    user_name = current_user.get("name")
    
    query = {}
    
    # If Athlete, restrict filter to their own profile or uploads by email
    if role == "Athlete":
        ath_doc = await db["athletes"].find_one({
            "$or": [
                {"full_name": {"$regex": f"^{user_name}$", "$options": "i"}},
                {"created_by": current_user.get("email")}
            ]
        })
        if ath_doc:
            query["$or"] = [
                {"athlete_id": str(ath_doc["_id"])},
                {"uploaded_by": current_user.get("email")}
            ]
        else:
            query["uploaded_by"] = current_user.get("email")
    elif athlete_id:
        query["athlete_id"] = athlete_id
        
    cursor = db["Videos"].find(query).sort("upload_date", -1)
    video_list = await cursor.to_list(length=100)
    
    # Convert ObjectIds to strings
    for doc in video_list:
        doc["_id"] = str(doc["_id"])
        
    return {
        "videos": video_list,
        "total": len(video_list)
    }

@router.get("/{id}", response_model=VideoOut)
async def get_video_details(
    id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Fetch detailed video meta logs.
    """
    role = current_user.get("role")
    user_name = current_user.get("name")
    
    try:
        video_doc = await db["Videos"].find_one({"_id": ObjectId(id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid video ID format."
        )
        
    if not video_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video record not found."
        )
        
    # Enforce Athlete read permissions check
    if role == "Athlete":
        ath_doc = await db["athletes"].find_one({"_id": ObjectId(video_doc["athlete_id"])})
        if not ath_doc or ath_doc.get("full_name", "").lower() != user_name.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only view details of your own videos."
            )
            
    video_doc["_id"] = str(video_doc["_id"])
    return video_doc

@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_video(
    id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Remove video from filesystem and delete its metadata records.
    Restricted to Admins, Coaches, or the Athlete who uploaded it.
    """
    role = current_user.get("role")
    user_name = current_user.get("name")
    email = current_user.get("email")
    
    try:
        video_doc = await db["Videos"].find_one({"_id": ObjectId(id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid video ID format."
        )
        
    if not video_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video record not found."
        )
        
    # Enforce delete restrictions
    if role == "Athlete":
        # Can only delete their own upload
        if video_doc.get("uploaded_by") != email:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only delete videos uploaded by yourself."
            )
    elif role not in ["Coach", "Admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Coaches, Admins, or the owner can delete videos."
        )
        
    # Remove file from disk
    file_path = os.path.join(UPLOAD_DIR, video_doc["stored_filename"])
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            print(f"Warning: Failed to erase file {file_path} from disk: {e}")
            
    # Delete metadata from DB
    await db["Videos"].delete_one({"_id": ObjectId(id)})
    # Delete related session
    await db["AnalysisSessions"].delete_many({"video_id": id})
    
    return {"message": "Video successfully erased from disk and database."}
