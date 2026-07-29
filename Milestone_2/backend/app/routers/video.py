from pathlib import Path

from fastapi import APIRouter
from fastapi import UploadFile
from fastapi import File
from fastapi import Depends
from fastapi import HTTPException
from fastapi.responses import StreamingResponse

from app.services.report_generator import generate_report
from sqlalchemy.orm import Session

from app.database.connection import get_db

from app.models.user import User
from app.models.video import Video
from app.models.athlete_profile import AthleteProfile

from app.schemas.video_schema import VideoResponse

from app.utils.roles import require_role

from app.services.pose_estimation import analyze_pose


router = APIRouter(
    prefix="/video",
    tags=["Video Upload"]
)


@router.post(
    "/upload",
    response_model=VideoResponse
)
def upload_video(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["athlete"]))
):

    user = db.query(User).filter(
        User.email == current_user["sub"]
    ).first()

    athlete = db.query(AthleteProfile).filter(
        AthleteProfile.user_id == user.id
    ).first()

    if not athlete:

        raise HTTPException(
            status_code=404,
            detail="Athlete profile not found"
        )

    upload_dir = Path("uploads/videos")
    upload_dir.mkdir(
        parents=True,
        exist_ok=True
    )

    file_path = upload_dir / file.filename

    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    analysis = analyze_pose(str(file_path))

    new_video = Video(
        athlete_id=athlete.id,
        filename=file.filename,
        filepath=str(file_path)
    )

    db.add(new_video)
    db.commit()
    db.refresh(new_video)

    return {
        "id": new_video.id,
        "athlete_id": new_video.athlete_id,
        "filename": new_video.filename,
        "filepath": new_video.filepath,
        "uploaded_at": new_video.uploaded_at,
        "analysis": analysis
    }

@router.get("/report/{video_id}")
def download_report(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["athlete"]))
):
    """
    Download PDF report for a video analysis.
    """

    video = (
        db.query(Video)
        .filter(Video.id == video_id)
        .first()
    )

    if not video:
        raise HTTPException(
            status_code=404,
            detail="Video not found."
        )

    pdf = generate_report(video)

    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
            f'attachment; filename="report_{video.filename}.pdf"'
        },
    )

@router.get("/history")
def get_video_history(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["athlete"]))
):

    user = db.query(User).filter(
        User.email == current_user["sub"]
    ).first()

    athlete = db.query(AthleteProfile).filter(
        AthleteProfile.user_id == user.id
    ).first()

    if not athlete:

        raise HTTPException(
            status_code=404,
            detail="Athlete profile not found"
        )

    videos = (
        db.query(Video)
        .filter(Video.athlete_id == athlete.id)
        .order_by(Video.uploaded_at.desc())
        .all()
    )

    history = []

    for video in videos:

        history.append({
            "id": video.id,
            "filename": video.filename,
            "filepath": video.filepath,
            "uploaded_at": video.uploaded_at
        })

    return history

@router.get("/dashboard")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["athlete"]))
):

    user = db.query(User).filter(
        User.email == current_user["sub"]
    ).first()

    athlete = db.query(AthleteProfile).filter(
        AthleteProfile.user_id == user.id
    ).first()

    videos = db.query(Video).filter(
        Video.athlete_id == athlete.id
    ).all()

    total_uploads = len(videos)

    latest_video = videos[-1] if videos else None

    latest_filename = latest_video.filename if latest_video else "No Upload"

    return {
        "total_uploads": total_uploads,
        "total_analysis": total_uploads,
        "latest_video": latest_filename,
        "current_risk": "Medium",
        "accuracy": "98%"
    }