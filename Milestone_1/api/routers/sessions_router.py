import os
import shutil
import io
import uuid
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Request
from fastapi.responses import StreamingResponse
from api.utils.rate_limiter import limiter
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from api.dependencies import get_current_user
from database.mongo_utils import get_db_connection
from src.main import run_pipeline
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from database.sql_utils import get_assigned_athletes
import math

def replace_nan_with_none(obj):
    if isinstance(obj, dict):
        return {k: replace_nan_with_none(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [replace_nan_with_none(v) for v in obj]
    elif isinstance(obj, float) and math.isnan(obj):
        return None
    return obj

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

# Ensure raw_videos dir exists
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "raw_videos")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class ProcessVideoRequest(BaseModel):
    secure_url: str
    custom_name: Optional[str] = None
    athlete_id: Optional[str] = None

@router.get("/upload-signature")
def get_signature(current_user: Dict[str, Any] = Depends(get_current_user)):
    from database.cloud_storage import get_upload_signature
    sig = get_upload_signature()
    if not sig:
        raise HTTPException(status_code=500, detail="Cloudinary not configured")
    return sig

@router.post("/process-video")
@limiter.limit("10/hour")
def process_video_endpoint(
    request: Request,
    payload: ProcessVideoRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    user_id = current_user["user_id"]
    
    if payload.athlete_id:
        if "coach" not in current_user["roles"] and "admin" not in current_user["roles"]:
            raise HTTPException(status_code=403, detail="Only coaches or admins can upload videos on behalf of athletes")
        
        assigned = get_assigned_athletes(user_id)
        is_assigned = any(str(ath["id"]) == str(payload.athlete_id) for ath in assigned)
        if not is_assigned and "admin" not in current_user["roles"]:
            raise HTTPException(status_code=403, detail="Athlete is not assigned to your roster")
        target_athlete_id = str(payload.athlete_id)
    else:
        target_athlete_id = str(user_id)
        
    final_video_name = payload.custom_name.strip() if payload.custom_name and payload.custom_name.strip() else "Direct_Upload_Video"
    
    from database import mongo_utils
    session_id = mongo_utils.generate_session_id()
    
    try:
        from src.worker.tasks import process_video_task
        task = process_video_task.delay(
            file_path=payload.secure_url, 
            athlete_id=target_athlete_id, 
            video_name=final_video_name, 
            session_id=session_id
        )
        return {
            "message": "Analysis started in background",
            "session_id": session_id,
            "task_id": task.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to enqueue task: {str(e)}")

@router.post("/upload-and-analyze")
@limiter.limit("10/hour")
async def upload_and_analyze(
    request: Request,
    video: UploadFile = File(...),
    custom_name: Optional[str] = Form(None),
    athlete_id: Optional[str] = Form(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    user_id = current_user["user_id"]
    
    # If athlete_id is provided, confirm coach authorization
    if athlete_id:
        if "coach" not in current_user["roles"] and "admin" not in current_user["roles"]:
            raise HTTPException(status_code=403, detail="Only coaches or admins can upload videos on behalf of athletes")
        
        assigned = get_assigned_athletes(user_id)
        is_assigned = any(str(ath["id"]) == str(athlete_id) for ath in assigned)
        if not is_assigned and "admin" not in current_user["roles"]:
            raise HTTPException(status_code=403, detail="Athlete is not assigned to your roster")
        target_athlete_id = str(athlete_id)
    else:
        target_athlete_id = str(user_id)

    if not video.filename.endswith(('.mp4', '.mov', '.avi')):
        raise HTTPException(status_code=400, detail="Invalid video format")
        
    file_extension = os.path.splitext(video.filename)[1]
    
    # Use custom name if provided, otherwise fallback to original filename
    final_video_name = custom_name.strip() + file_extension if custom_name and custom_name.strip() else video.filename
    safe_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    from database import mongo_utils
    session_id = mongo_utils.generate_session_id()

    # Check file size (500MB limit)
    MAX_FILE_SIZE_MB = 500
    MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
    
    video_bytes = await video.read()
    if len(video_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE_MB}MB."
        )

    # Save video temporarily on Render disk
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(video_bytes)
            
        # Upload to Cloudinary for distributed processing
        from database.cloud_storage import upload_video
        secure_url = upload_video(file_path, public_id=f"raw_{session_id}")
        
        # If upload succeeded, cleanup the local Render disk and pass the URL instead
        if secure_url and os.path.exists(file_path):
            os.remove(file_path)
            file_path = secure_url
            
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to process video upload: {str(e)}")

    # Enqueue Celery Task
    try:
        from src.worker.tasks import process_video_task
        task = process_video_task.delay(
            file_path=file_path, 
            athlete_id=target_athlete_id, 
            video_name=final_video_name, 
            session_id=session_id
        )
        return {
            "message": "Analysis started in background",
            "session_id": session_id,
            "task_id": task.id
        }
    except Exception as e:
        # Don't try to delete URL strings
        if not file_path.startswith("http") and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to enqueue task: {str(e)}")

@router.get("/history")
def get_history(current_user: Dict[str, Any] = Depends(get_current_user)):
    athlete_id = current_user["user_id"]
    db = get_db_connection()
    sessions_col = db["sessions"]
    
    sessions = list(sessions_col.find(
        {"athlete_id": athlete_id}
    ).sort("created_at", -1))
    
    session_ids = [s["session_id"] for s in sessions]
    
    # Batch queries instead of N+1
    risk_scores = {
        doc["session_id"]: doc.get("risk_data", {})
        for doc in db["risk_scores"].find({"session_id": {"$in": session_ids}})
    }
    
    bio_data_docs = {
        doc["session_id"]: doc.get("summary", {})
        for doc in db["biomechanics_data"].find({"session_id": {"$in": session_ids}})
    }
    
    # Clean up ObjectIds and attach risk data and biomechanics
    for s in sessions:
        s["_id"] = str(s["_id"])
        s["risk_data"] = risk_scores.get(s["session_id"], {})
        s["biomechanics"] = bio_data_docs.get(s["session_id"], {})
        
    return replace_nan_with_none(sessions)

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
    
    risk_score = db["risk_scores"].find_one({"session_id": session_id})
    if risk_score:
        session["risk_data"] = risk_score.get("risk_data", {})
    else:
        session["risk_data"] = {}
        
    bio_data = db["biomechanics_data"].find_one({"session_id": session_id})
    if bio_data:
        session["biomechanics"] = bio_data.get("summary", {})
    else:
        session["biomechanics"] = {}
        
    return replace_nan_with_none(session)

@router.delete("/{session_id}")
def delete_session(session_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    athlete_id = current_user["user_id"]
    db = get_db_connection()
    
    session = db["sessions"].find_one({"session_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if session["athlete_id"] != athlete_id and "coach" not in current_user["roles"] and "admin" not in current_user["roles"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this session")
        
    # Delete from all related collections
    db["sessions"].delete_one({"session_id": session_id})
    db["risk_scores"].delete_one({"session_id": session_id})
    db["biomechanics_data"].delete_one({"session_id": session_id})
    db["recommendations"].delete_one({"session_id": session_id})
    
    return {"message": "Session and all related data deleted successfully"}

@router.get("/{session_id}/report/download")
def download_analysis_report(session_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    athlete_id = current_user["user_id"]
    db = get_db_connection()
    session = db["sessions"].find_one({"session_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if session["athlete_id"] != athlete_id and "coach" not in current_user["roles"] and "admin" not in current_user["roles"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    risk_score = db["risk_scores"].find_one({"session_id": session_id})
    if not risk_score:
        raise HTTPException(status_code=404, detail="Analysis data not found")

    risk_data = risk_score.get("risk_data", {})
    
    # Generate PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    story.append(Paragraph(f"MoveIQ Biomechanics Report: {session.get('video_name', 'Unknown')}", styles["Title"]))
    story.append(Spacer(1, 12))
    
    story.append(Paragraph("1. Health Overview", styles["Heading2"]))
    story.append(Paragraph(f"Overall Health Score: {risk_data.get('overall_health_score', 0)}/100", styles["Normal"]))
    story.append(Paragraph(f"Risk Category: {risk_data.get('risk_category', 'Unknown')}", styles["Normal"]))
    story.append(Spacer(1, 12))
    
    story.append(Paragraph("2. Sub-Scores", styles["Heading2"]))
    story.append(Paragraph(f"Injury Risk Score: {risk_data.get('final_risk_score', 0)}/100", styles["Normal"]))
    story.append(Paragraph(f"Movement Quality: {risk_data.get('movement_quality_score', 0)}/100", styles["Normal"]))
    story.append(Paragraph(f"Efficiency: {risk_data.get('biomechanical_efficiency_score', 0)}/100", styles["Normal"]))
    story.append(Paragraph(f"Fatigue: {risk_data.get('fatigue_score', 0)}/100", styles["Normal"]))
    story.append(Spacer(1, 12))
    
    story.append(Paragraph("3. Flagged Issues", styles["Heading2"]))
    flagged = risk_data.get("flagged_issues", "None")
    if isinstance(flagged, str) and flagged != "None":
        for issue in flagged.split(" | "):
            story.append(Paragraph(f"• {issue}", styles["Normal"]))
    else:
        story.append(Paragraph("No major issues detected.", styles["Normal"]))
        
    try:
        doc.build(story)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to build PDF: {str(e)}")
        
    buffer.seek(0)
    
    return StreamingResponse(
        buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename=Analysis_Report_{session_id}.pdf"}
    )

@router.get("/{session_id}/recommendation")
async def get_recommendation(session_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    from database.mongo_utils import get_full_report
    from fastapi.concurrency import run_in_threadpool
    
    # 1. Check if the report already exists in MongoDB
    report_data = get_full_report(session_id)
    
    if report_data:
        return {"session_id": session_id, "report": report_data.get("raw_text_report")}
        
    # 2. If it doesn't exist, we must generate it using the LLM engine
    try:
        from src.recommendations.engine import run_engine
        await run_in_threadpool(run_engine, session_id)
        
        # Now fetch it again since it should be saved
        report_data = get_full_report(session_id)
        if report_data:
            return {"session_id": session_id, "report": report_data.get("raw_text_report")}
        else:
            raise HTTPException(status_code=500, detail="Recommendation generated but failed to save")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendation: {str(e)}")
