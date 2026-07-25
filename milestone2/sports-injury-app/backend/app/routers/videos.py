"""
routers/videos.py
--------------------
Video upload + pose estimation + biomechanical analysis pipeline.

Flow:
  1. POST .../videos  -> file saved to disk, a Video row is created with
     status="uploaded", and processing is kicked off as a FastAPI
     BackgroundTask so the upload request returns immediately instead of
     making the caller wait for pose estimation to finish.
  2. The background task runs MediaPipe over every frame, writes an
     annotated (skeleton-overlay) video, and stores one VideoFrame row per
     analyzed frame with that frame's joint angles. Video.status moves to
     "processing" then "completed" (or "failed", with error_message set).
  3. The frontend polls GET .../videos/{id} until status is no longer
     "processing", then fetches .../analysis for the aggregated summary.

Known limitation, flagged deliberately rather than hidden: BackgroundTasks
run in-process on the same server handling API requests. That's fine for a
single developer testing this locally, but it means a slow video blocks that
server process's capacity, and processing state is lost if the server
restarts mid-job. The architecture doc's message-queue layer (a real task
queue like Celery+Redis, running on separate workers) is the production fix
for this -- worth doing before this handles real concurrent traffic, not
before.
"""

import os
import shutil
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db, SessionLocal
from app.auth import get_current_user
from app.permissions import require_profile_read_access, get_athlete_profile_or_404
from app.storage import original_video_path, annotated_video_path
from app.services import pose_estimation, biomechanics

router = APIRouter(prefix="/athletes/{profile_id}/videos", tags=["Video Analysis"])

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv"}
MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024  # 200 MB -- generous for a short test clip, not for a full match recording


def _require_upload_or_delete_access(profile_id: uuid.UUID, current_user: models.User, db: Session) -> models.AthleteProfile:
    """Same pattern as training load: the athlete can act on their own video,
    or coach/physiotherapist/sports_scientist/admin can act on any athlete's."""
    profile = get_athlete_profile_or_404(db, profile_id)
    is_owner = current_user.role == models.UserRole.athlete and profile.user_id == current_user.id
    is_staff = current_user.role in (
        models.UserRole.coach, models.UserRole.physiotherapist,
        models.UserRole.sports_scientist, models.UserRole.admin,
    )
    if not (is_owner or is_staff):
        raise HTTPException(status_code=403, detail="You do not have permission to manage videos for this athlete")
    return profile


def _run_pose_estimation_job(video_id: uuid.UUID):
    """
    Runs in the background after the upload request has already returned.
    Uses its own database session -- the request-scoped session from the
    original endpoint is closed by the time this runs.
    """
    db = SessionLocal()
    try:
        video = db.query(models.Video).filter(models.Video.id == video_id).first()
        if not video:
            return

        video.status = models.VideoStatus.processing
        db.commit()

        try:
            meta = pose_estimation.get_video_metadata(video.storage_path)
            video.fps = meta["fps"]
            video.frame_count = meta["frame_count"]
            video.duration_seconds = meta["duration_seconds"]
            db.commit()

            out_path = annotated_video_path(video.id)
            analyzed_count = 0

            for frame_result in pose_estimation.process_video(video.storage_path, out_path):
                angles = biomechanics.compute_frame_angles(frame_result["landmarks"])
                frame_row = models.VideoFrame(
                    video_id=video.id,
                    frame_number=frame_result["frame_number"],
                    timestamp_seconds=frame_result["timestamp_seconds"],
                    pose_detected=frame_result["pose_detected"],
                    landmarks=frame_result["landmarks"],
                    **angles,
                )
                db.add(frame_row)
                if frame_result["pose_detected"]:
                    analyzed_count += 1

            video.annotated_storage_path = out_path
            video.analyzed_frame_count = analyzed_count
            video.status = models.VideoStatus.completed
            video.processed_at = datetime.utcnow()
            db.commit()

        except Exception as exc:
            video.status = models.VideoStatus.failed
            video.error_message = str(exc)[:2000]
            db.commit()
    finally:
        db.close()


@router.post("", response_model=schemas.VideoOut, status_code=201)
def upload_video(
    profile_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    activity_type: models.ActivityType = Form(models.ActivityType.other),
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = _require_upload_or_delete_access(profile_id, current_user, db)

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}")

    video = models.Video(
        athlete_profile_id=profile.id,
        uploaded_by_user_id=current_user.id,
        activity_type=activity_type,
        original_filename=file.filename,
        storage_path="",  # set below once we know the video's id
        status=models.VideoStatus.uploaded,
    )
    db.add(video)
    db.flush()  # assigns video.id without committing yet

    dest_path = original_video_path(video.id, file.filename)
    size = 0
    with open(dest_path, "wb") as out_file:
        while chunk := file.file.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_FILE_SIZE_BYTES:
                out_file.close()
                os.remove(dest_path)
                db.rollback()
                raise HTTPException(status_code=413, detail="Video file too large (200MB limit)")
            out_file.write(chunk)

    video.storage_path = dest_path
    db.commit()
    db.refresh(video)

    background_tasks.add_task(_run_pose_estimation_job, video.id)
    return video


@router.get("", response_model=list[schemas.VideoOut])
def list_videos(
    profile: models.AthleteProfile = Depends(require_profile_read_access),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Video)
        .filter(models.Video.athlete_profile_id == profile.id)
        .order_by(models.Video.uploaded_at.desc())
        .all()
    )


def _get_video_or_404(db: Session, profile_id: uuid.UUID, video_id: uuid.UUID) -> models.Video:
    video = (
        db.query(models.Video)
        .filter(models.Video.id == video_id, models.Video.athlete_profile_id == profile_id)
        .first()
    )
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video


@router.get("/{video_id}", response_model=schemas.VideoOut)
def get_video(
    video_id: uuid.UUID,
    profile: models.AthleteProfile = Depends(require_profile_read_access),
    db: Session = Depends(get_db),
):
    return _get_video_or_404(db, profile.id, video_id)


@router.get("/{video_id}/analysis", response_model=schemas.VideoAnalysisSummary)
def get_video_analysis(
    video_id: uuid.UUID,
    profile: models.AthleteProfile = Depends(require_profile_read_access),
    db: Session = Depends(get_db),
):
    video = _get_video_or_404(db, profile.id, video_id)
    if video.status != models.VideoStatus.completed:
        raise HTTPException(status_code=409, detail=f"Analysis not available yet (status: {video.status.value})")

    frames = db.query(models.VideoFrame).filter(models.VideoFrame.video_id == video.id).all()
    frame_dicts = [
        {
            "left_knee_angle": f.left_knee_angle, "right_knee_angle": f.right_knee_angle,
            "left_hip_angle": f.left_hip_angle, "right_hip_angle": f.right_hip_angle,
            "left_elbow_angle": f.left_elbow_angle, "right_elbow_angle": f.right_elbow_angle,
            "trunk_lean_angle": f.trunk_lean_angle,
        }
        for f in frames
    ]
    summary = biomechanics.summarize_video(frame_dicts)
    return {"video": video, **summary}


@router.get("/{video_id}/frames", response_model=list[schemas.VideoFrameOut])
def get_video_frames(
    video_id: uuid.UUID,
    profile: models.AthleteProfile = Depends(require_profile_read_access),
    db: Session = Depends(get_db),
):
    video = _get_video_or_404(db, profile.id, video_id)
    return (
        db.query(models.VideoFrame)
        .filter(models.VideoFrame.video_id == video.id)
        .order_by(models.VideoFrame.frame_number)
        .all()
    )


@router.get("/{video_id}/annotated")
def get_annotated_video(
    video_id: uuid.UUID,
    profile: models.AthleteProfile = Depends(require_profile_read_access),
    db: Session = Depends(get_db),
):
    video = _get_video_or_404(db, profile.id, video_id)
    if not video.annotated_storage_path or not os.path.exists(video.annotated_storage_path):
        raise HTTPException(status_code=404, detail="Annotated video not available yet")
    return FileResponse(video.annotated_storage_path, media_type="video/mp4")


@router.post("/{video_id}/reprocess", response_model=schemas.VideoOut)
def reprocess_video(
    video_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    profile_id: uuid.UUID,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_upload_or_delete_access(profile_id, current_user, db)
    video = _get_video_or_404(db, profile_id, video_id)

    db.query(models.VideoFrame).filter(models.VideoFrame.video_id == video.id).delete()
    video.status = models.VideoStatus.uploaded
    video.error_message = None
    db.commit()
    db.refresh(video)

    background_tasks.add_task(_run_pose_estimation_job, video.id)
    return video


@router.delete("/{video_id}", status_code=204)
def delete_video(
    video_id: uuid.UUID,
    profile_id: uuid.UUID,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_upload_or_delete_access(profile_id, current_user, db)
    video = _get_video_or_404(db, profile_id, video_id)

    video_folder = os.path.dirname(video.storage_path) if video.storage_path else None
    db.delete(video)
    db.commit()

    if video_folder and os.path.exists(video_folder):
        shutil.rmtree(video_folder, ignore_errors=True)
    return None
