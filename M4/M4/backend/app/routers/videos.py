from datetime import datetime
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session, joinedload

from .. import auth, models, schemas
from ..database import get_db
from ..services.analyzer import analyze_video

router = APIRouter(prefix="/videos", tags=["Video Analysis"])
UPLOAD_DIR = Path(__file__).resolve().parents[1] / "storage" / "videos"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".webm", ".mkv"}


def serialize_analysis(analysis: models.VideoAnalysis) -> dict:
    return {"id": analysis.id, "athlete_id": analysis.athlete_id, "athlete_name": analysis.athlete.user.full_name, "original_filename": analysis.original_filename, "activity": analysis.activity, "status": analysis.status, "duration_seconds": analysis.duration_seconds, "fps": analysis.fps, "frame_count": analysis.frame_count, "quality_score": analysis.quality_score, "pose_confidence": analysis.pose_confidence, "pose_engine": analysis.pose_engine, "error_message": analysis.error_message, "created_at": analysis.created_at, "processed_at": analysis.processed_at, "result": analysis.result}


def get_analysis_or_404(analysis_id: int, db: Session) -> models.VideoAnalysis:
    analysis = db.query(models.VideoAnalysis).options(joinedload(models.VideoAnalysis.athlete).joinedload(models.AthleteProfile.user), joinedload(models.VideoAnalysis.result)).filter(models.VideoAnalysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis


def ensure_access(analysis: models.VideoAnalysis, user: models.User) -> None:
    if user.role == models.RoleEnum.athlete and analysis.athlete.user_id != user.id:
        raise HTTPException(status_code=403, detail="You can only access your own analyses")


@router.post("/upload", response_model=schemas.VideoAnalysisOut, status_code=status.HTTP_201_CREATED)
async def upload_video(file: UploadFile = File(...), activity: str = Form(..., min_length=3, max_length=80), athlete_id: int | None = Form(None), current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    filename = file.filename or "movement-video.mp4"
    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS or not (file.content_type or "").startswith("video/"):
        raise HTTPException(status_code=415, detail="Upload an MP4, MOV, AVI, WEBM, or MKV video file")
    if current_user.role == models.RoleEnum.athlete:
        athlete = current_user.athlete_profile
    else:
        if not athlete_id:
            raise HTTPException(status_code=422, detail="Staff uploads require an athlete_id")
        athlete = db.query(models.AthleteProfile).filter(models.AthleteProfile.id == athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete profile not found")
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=422, detail="The uploaded video is empty")
    if len(contents) > 100 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Video exceeds the 100 MB upload limit")
    stored_name = f"{uuid4().hex}{suffix}"
    stored_path = UPLOAD_DIR / stored_name
    stored_path.write_bytes(contents)
    analysis = models.VideoAnalysis(athlete_id=athlete.id, uploaded_by_id=current_user.id, original_filename=Path(filename).name[:255], stored_filename=stored_name, activity=activity.strip(), status=models.AnalysisStatus.processing)
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    try:
        assessment = analyze_video(stored_path, analysis.activity, athlete.training_load, athlete.injury_history)
        signals = assessment.pop("signals")
        analysis.duration_seconds, analysis.fps, analysis.frame_count = signals["duration_seconds"], signals["fps"], signals["frame_count"]
        analysis.quality_score, analysis.pose_confidence, analysis.pose_engine = signals["quality_score"], signals["pose_confidence"], signals["pose_engine"]
        analysis.status, analysis.processed_at = models.AnalysisStatus.completed, datetime.utcnow()
        result = models.RiskAssessment(analysis_id=analysis.id, **assessment)
        db.add(result)
        severity = "critical" if result.risk_level in {"critical", "high"} else "info"
        db.add(models.Notification(recipient_id=athlete.user_id, title=f"{result.risk_level.title()} risk assessment ready", message=f"Your {activity} analysis returned an overall injury risk score of {result.overall_risk}/100.", severity=severity))
        db.commit()
    except Exception as exc:
        analysis.status, analysis.error_message = models.AnalysisStatus.failed, "Analysis could not be completed. Please upload a valid movement video."
        db.commit()
        raise HTTPException(status_code=422, detail=analysis.error_message) from exc
    return serialize_analysis(get_analysis_or_404(analysis.id, db))


@router.get("", response_model=list[schemas.VideoAnalysisOut])
def list_analyses(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    query = db.query(models.VideoAnalysis).options(joinedload(models.VideoAnalysis.athlete).joinedload(models.AthleteProfile.user), joinedload(models.VideoAnalysis.result)).order_by(models.VideoAnalysis.created_at.desc())
    if current_user.role == models.RoleEnum.athlete:
        query = query.join(models.AthleteProfile).filter(models.AthleteProfile.user_id == current_user.id)
    return [serialize_analysis(analysis) for analysis in query.all()]


@router.get("/{analysis_id}", response_model=schemas.VideoAnalysisOut)
def get_analysis(analysis_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    analysis = get_analysis_or_404(analysis_id, db)
    ensure_access(analysis, current_user)
    return serialize_analysis(analysis)


@router.get("/{analysis_id}/pose", tags=["Pose Estimation"])
def get_pose_summary(analysis_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    analysis = get_analysis_or_404(analysis_id, db)
    ensure_access(analysis, current_user)
    if not analysis.result:
        raise HTTPException(status_code=409, detail="Pose summary is not available until analysis completes")
    return {"analysis_id": analysis.id, "engine": analysis.pose_engine, "confidence": analysis.pose_confidence, "keypoints": ["head", "shoulders", "elbows", "wrists", "hips", "knees", "ankles", "feet"], "metrics": analysis.result.metrics}
