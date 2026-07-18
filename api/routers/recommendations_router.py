import io
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import Dict, Any
from api.dependencies import get_current_user
from database.mongo_utils import get_db_connection
from src.recommendations.engine import run_engine
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])
@router.get("/history")
def get_history(current_user: Dict[str, Any] = Depends(get_current_user)):
    athlete_id = current_user["user_id"]
    db = get_db_connection()
    
    # Find all sessions for the user
    sessions = list(db["sessions"].find({"athlete_id": athlete_id}))
    session_ids = [s["session_id"] for s in sessions]
    
    # Find all summaries for these sessions
    summaries = list(db["recommendations"].find({"session_id": {"$in": session_ids}}))
    
    history = []
    for s in sessions:
        summary = next((sum for sum in summaries if sum["session_id"] == s["session_id"]), None)
        if summary:
            history.append({
                "session_id": s["session_id"],
                "video_name": s.get("video_name", "Unknown Video"),
                "created_at": s.get("created_at"),
                "one_line_summary": summary.get("recommendations", {}).get("one_line_summary", "Recommendation available")
            })
            
    # Sort by created_at descending (newest first)
    history.sort(key=lambda x: x.get("created_at") or "", reverse=True)
    return history

@router.post("/{session_id}/generate")
def generate_recommendations(session_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    athlete_id = current_user["user_id"]
    
    # 1. Verify session exists and belongs to user
    db = get_db_connection()
    session = db["sessions"].find_one({"session_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if session["athlete_id"] != athlete_id and "coach" not in current_user["roles"] and "admin" not in current_user["roles"]:
        raise HTTPException(status_code=403, detail="Not authorized for this session")

    # 2. Check if risk scores exist for this session
    risk_score = db["risk_scores"].find_one({"session_id": session_id})
    if not risk_score:
        raise HTTPException(status_code=400, detail="Cannot generate recommendations: No risk scores found for this session")

    # 3. Run engine
    try:
        final_state = run_engine(session_id=session_id, video_name=session["video_name"])
        return {"message": "Recommendations generated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(e)}")

@router.get("/{session_id}")
def get_structured_recommendation(session_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    athlete_id = current_user["user_id"]
    
    db = get_db_connection()
    session = db["sessions"].find_one({"session_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if session["athlete_id"] != athlete_id and "coach" not in current_user["roles"] and "admin" not in current_user["roles"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    rec = db["recommendations"].find_one({"session_id": session_id})
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendations not found")

    rec["_id"] = str(rec["_id"])
    return rec

@router.get("/{session_id}/report")
def get_report(session_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    athlete_id = current_user["user_id"]
    
    db = get_db_connection()
    session = db["sessions"].find_one({"session_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if session["athlete_id"] != athlete_id and "coach" not in current_user["roles"] and "admin" not in current_user["roles"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    report = db["full_recommendation_reports"].find_one({"session_id": session_id})
    if not report:
        raise HTTPException(status_code=404, detail="Report not generated yet")

    report["_id"] = str(report["_id"])
    return report

@router.get("/{session_id}/download")
def download_report(session_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    athlete_id = current_user["user_id"]
    
    db = get_db_connection()
    session = db["sessions"].find_one({"session_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if session["athlete_id"] != athlete_id and "coach" not in current_user["roles"] and "admin" not in current_user["roles"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    report = db["full_recommendation_reports"].find_one({"session_id": session_id})
    if not report or "raw_text_report" not in report:
        raise HTTPException(status_code=404, detail="Report not generated yet")

    raw_text = report["raw_text_report"]

    # Generate PDF in memory
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    # Very basic parsing of the markdown text to paragraph
    for line in raw_text.split('\n'):
        if not line.strip():
            story.append(Spacer(1, 12))
            continue
            
        style = styles["Normal"]
        if line.startswith("# "):
            style = styles["Title"]
            line = line[2:]
        elif line.startswith("## "):
            style = styles["Heading2"]
            line = line[3:]
        elif line.startswith("### "):
            style = styles["Heading3"]
            line = line[4:]
            
        story.append(Paragraph(line, style))

    try:
        doc.build(story)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to build PDF: {str(e)}")
        
    buffer.seek(0)
    
    return StreamingResponse(
        buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename=Rehab_Plan_{session_id}.pdf"}
    )
