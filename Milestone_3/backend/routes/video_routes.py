import os
import shutil
import uuid
from typing import List

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from database import get_db, SessionLocal
from models import Video, PoseFrame, BiomechanicsReport, Athlete, InjuryRiskAssessment
from schemas import (
    VideoOut,
    PoseFrameOut,
    BiomechanicsReportOut,
    InjuryRiskAssessmentOut,
    AthleteRiskOverviewOut,
    VideoRiskSummary,
)
from services.pose_estimation import PoseEstimator
from services.biomechanics import compute_joint_angles, generate_biomechanics_report
from services.injury_risk import generate_injury_risk_assessment

# Reuses the same get_current_user your athlete routes already use
# (it just decodes the JWT and returns the user_id).
from routes.athelete_routes import get_current_user

router = APIRouter(prefix="/videos", tags=["Video Analysis"])

UPLOAD_DIR = "uploads/videos"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi"}
MAX_FILE_SIZE_MB = 200


def _get_own_athlete(db: Session, user_id: int) -> Athlete:
    """Every video belongs to the logged-in user's own athlete profile —
    same ownership model as /athlete/profile in athelete_routes.py."""
    athlete = db.query(Athlete).filter(Athlete.user_id == user_id).first()
    if not athlete:
        raise HTTPException(
            status_code=400,
            detail="Create your athlete profile first (Milestone 1) before uploading videos.",
        )
    return athlete


@router.post("/upload", response_model=VideoOut)
async def upload_video(
    background_tasks: BackgroundTasks,
    activity_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    athlete = _get_own_athlete(db, user_id)

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {sorted(ALLOWED_EXTENSIONS)}",
        )

    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    size_mb = os.path.getsize(file_path) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        os.remove(file_path)
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({size_mb:.1f}MB). Max allowed is {MAX_FILE_SIZE_MB}MB.",
        )

    video = Video(
        athlete_id=athlete.athlete_id,
        filename=file.filename,
        file_path=file_path,
        activity_type=activity_type,
        status="uploaded",
    )
    db.add(video)
    db.commit()
    db.refresh(video)

    # Runs after the response is sent — frontend polls GET /videos/{id}
    # until status flips to "completed" or "failed".
    background_tasks.add_task(process_video_task, video.id)

    return video


def process_video_task(video_id: int):
    """
    Runs pose estimation + biomechanical analysis in the background.
    Uses its own DB session since it runs outside the request lifecycle.
    """
    db = SessionLocal()
    try:
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            return

        video.status = "processing"
        db.commit()

        estimator = PoseEstimator()
        try:
            result = estimator.process_video(video.file_path, sample_every_n_frames=2)
        finally:
            estimator.close()

        video.fps = result["fps"]
        video.total_frames = result["total_frames"]
        video.duration_seconds = result["duration_seconds"]

        frame_records = []
        frames_for_report = []
        for f in result["frames"]:
            angles = compute_joint_angles(f["keypoints"])
            frame_records.append(
                PoseFrame(
                    video_id=video.id,
                    frame_number=f["frame_number"],
                    timestamp_ms=f["timestamp_ms"],
                    keypoints=f["keypoints"],
                    joint_angles=angles,
                )
            )
            frames_for_report.append({"keypoints": f["keypoints"], "joint_angles": angles})

        db.bulk_save_objects(frame_records)

        report_data = generate_biomechanics_report(frames_for_report)
        db.add(BiomechanicsReport(video_id=video.id, **report_data))

        # Milestone 3 — Injury Risk Prediction / Anomaly Detection / Risk
        # Scoring / Corrective Recommendation Engines, chained onto the
        # same pipeline. Wrapped in its own try/except so that if this
        # step ever fails, the athlete still gets their Milestone 2
        # biomechanics results instead of the whole video failing.
        try:
            athlete_obj = db.query(Athlete).filter(Athlete.athlete_id == video.athlete_id).first()
            risk_data = generate_injury_risk_assessment(
                frames_for_report, report_data, athlete_obj, video.activity_type
            )
            db.add(InjuryRiskAssessment(video_id=video.id, athlete_id=video.athlete_id, **risk_data))
        except Exception as risk_err:  # noqa: BLE001
            print(f"Injury risk assessment failed for video {video.id}: {risk_err}")

        video.status = "completed"
        db.commit()

    except Exception as e:  # noqa: BLE001 — persist whatever went wrong
        video.status = "failed"
        video.error_message = str(e)
        db.commit()
    finally:
        db.close()


@router.get("/risk/overview", response_model=AthleteRiskOverviewOut)
def get_my_risk_overview(
    db: Session = Depends(get_db), user_id: int = Depends(get_current_user)
):
    """Milestone 3 — Athlete Dashboard 'Injury risk score' + trend (PDF section 10)."""
    athlete = _get_own_athlete(db, user_id)

    videos = (
        db.query(Video)
        .filter(Video.athlete_id == athlete.athlete_id, Video.status == "completed")
        .order_by(Video.uploaded_at.desc())
        .all()
    )

    history = []
    latest_assessment = None
    for v in videos:
        assessment = (
            db.query(InjuryRiskAssessment).filter(InjuryRiskAssessment.video_id == v.id).first()
        )
        if not assessment:
            continue
        history.append(
            VideoRiskSummary(
                video_id=v.id,
                activity_type=v.activity_type,
                uploaded_at=v.uploaded_at,
                overall_injury_risk_score=assessment.overall_injury_risk_score,
                risk_category=assessment.risk_category,
            )
        )
        if latest_assessment is None:
            latest_assessment = assessment

    return AthleteRiskOverviewOut(
        athlete_id=athlete.athlete_id,
        latest_assessment=latest_assessment,
        history=history,
    )


@router.get("/{video_id}", response_model=VideoOut)
def get_video(
    video_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user)
):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video


@router.get("/{video_id}/pose-frames", response_model=List[PoseFrameOut])
def get_pose_frames(
    video_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user)
):
    frames = (
        db.query(PoseFrame)
        .filter(PoseFrame.video_id == video_id)
        .order_by(PoseFrame.frame_number)
        .all()
    )
    if not frames:
        raise HTTPException(status_code=404, detail="No pose data found for this video yet")
    return frames


@router.get("/{video_id}/biomechanics", response_model=BiomechanicsReportOut)
def get_biomechanics_report(
    video_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user)
):
    report = (
        db.query(BiomechanicsReport).filter(BiomechanicsReport.video_id == video_id).first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not generated yet")
    return report


@router.get("/{video_id}/risk-assessment", response_model=InjuryRiskAssessmentOut)
def get_risk_assessment(
    video_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user)
):
    assessment = (
        db.query(InjuryRiskAssessment).filter(InjuryRiskAssessment.video_id == video_id).first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Risk assessment not generated yet")
    return assessment


@router.get("/", response_model=List[VideoOut])
def list_my_videos(
    db: Session = Depends(get_db), user_id: int = Depends(get_current_user)
):
    athlete = _get_own_athlete(db, user_id)
    return (
        db.query(Video)
        .filter(Video.athlete_id == athlete.athlete_id)
        .order_by(Video.uploaded_at.desc())
        .all()
    )
