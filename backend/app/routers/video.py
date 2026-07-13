from pathlib import Path

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db

from app.models.user import User
from app.models.video import Video
from app.models.athlete_profile import AthleteProfile

from app.schemas.video_schema import VideoResponse

from app.utils.roles import require_role

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
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / file.filename

    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    new_video = Video(
        athlete_id=athlete.id,
        filename=file.filename,
        filepath=str(file_path)
    )

    db.add(new_video)
    db.commit()
    db.refresh(new_video)

    return new_video