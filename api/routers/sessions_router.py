import os
import shutil
import io
import uuid
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from typing import Dict, Any, List, Optional
from api.dependencies import get_current_user
from database.mongo_utils import get_db_connection
from src.main import run_pipeline
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

# Ensure raw_videos dir exists
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "raw_videos")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload-and-analyze")
def upload_and_analyze(
    video: UploadFile = File(...),
    custom_name: Optional[str] = Form(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    athlete_id = current_user["user_id"]
    
    if not video.filename.endswith(('.mp4', '.mov', '.avi')):
        raise HTTPException(status_code=400, detail="Invalid video format")
        
    file_extension = os.path.splitext(video.filename)[1]
    
    # Use custom name if provided, otherwise fallback to original filename
    final_video_name = custom_name.strip() + file_extension if custom_name and custom_name.strip() else video.filename
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
        result = run_pipeline(athlete_id=athlete_id, video_name=final_video_name, source_path=file_path)
        return {
            "message": "Analysis complete",
            "session_id": result["session_id"],
            "video_name": final_video_name,
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
    
    # Exclude key_moments to save bandwidth for the history list
    sessions = list(sessions_col.find(
        {"athlete_id": athlete_id}, 
        {"key_moments": 0}
    ).sort("created_at", -1))
    
    # Clean up ObjectIds and attach risk data
    for s in sessions:
        s["_id"] = str(s["_id"])
        risk_score = db["risk_scores"].find_one({"session_id": s["session_id"]})
        if risk_score:
            s["risk_data"] = risk_score.get("risk_data", {})
        else:
            s["risk_data"] = {}
        
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
        
    return session

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
def get_recommendation(session_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    from database.mongo_utils import get_full_report
    
    # 1. Check if the report already exists in MongoDB
    report_data = get_full_report(session_id)
    
    if report_data:
        return {"session_id": session_id, "report": report_data.get("raw_text_report")}
        
    # 2. If it doesn't exist, we must generate it using the LLM engine
    try:
        from src.recommendations.engine import run_engine
        run_engine(session_id)
        
        # Now fetch it again since it should be saved
        report_data = get_full_report(session_id)
        if report_data:
            return {"session_id": session_id, "report": report_data.get("raw_text_report")}
        else:
            raise HTTPException(status_code=500, detail="Recommendation generated but failed to save")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendation: {str(e)}")
