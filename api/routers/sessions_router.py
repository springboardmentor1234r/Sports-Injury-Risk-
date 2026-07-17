import os
import shutil
import uuid
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import Dict, Any, List
from api.dependencies import get_current_user
from database.mongo_utils import get_db_connection
from src.main import run_pipeline

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

# Ensure raw_videos dir exists
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "raw_videos")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload-and-analyze")
def upload_and_analyze(
    video: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    athlete_id = current_user["user_id"]
    
    if not video.filename.endswith(('.mp4', '.mov', '.avi')):
        raise HTTPException(status_code=400, detail="Invalid video format")
        
    # Generate a unique filename so simultaneous uploads never collide/overwrite each other
    file_extension = os.path.splitext(video.filename)[1]
    safe_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    # Save video temporarily
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save video: {str(e)}")

    # Run pipeline
    try:
        result = run_pipeline(athlete_id=athlete_id, source_path=file_path)
        return {
            "message": "Analysis complete",
            "session_id": result["session_id"],
            "risk_data": result["risk_data"],
            "video_url": result["annotated_video_url"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")
    finally:
        # Clean up the temporary video file, whether the pipeline succeeded or failed
        if os.path.exists(file_path):
            os.remove(file_path)

@router.get("/history")
def get_history(current_user: Dict[str, Any] = Depends(get_current_user)):
    athlete_id = current_user["user_id"]
    db = get_db_connection()
    sessions_col = db["sessions"]
    
    sessions = list(sessions_col.find({"athlete_id": athlete_id}).sort("created_at", -1))
    
    # Clean up ObjectIds
    for s in sessions:
        s["_id"] = str(s["_id"])
        
    return sessions

@router.get("/{session_id}")
def get_session(session_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    athlete_id = current_user["user_id"]
    db = get_db_connection()
    
    session = db["sessions"].find_one({"session_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # Optional: Basic authorization check to ensure the athlete owns this session
    # Admin/coach logic would need to be expanded here
    if session["athlete_id"] != athlete_id and "coach" not in current_user["roles"] and "admin" not in current_user["roles"]:
        raise HTTPException(status_code=403, detail="Not authorized to view this session")
        
    session["_id"] = str(session["_id"])
    return session
