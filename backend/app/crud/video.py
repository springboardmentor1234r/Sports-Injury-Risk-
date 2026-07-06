from sqlalchemy.orm import Session

from app.models.video import Video


def create_video(
    db: Session,
    athlete_id: int,
    file_name: str,
    file_path: str,
    metadata: dict,
):

    video = Video(
        athlete_id=athlete_id,
        file_name=file_name,
        file_path=file_path,
        fps=metadata["fps"],
        total_frames=metadata["total_frames"],
        duration=metadata["duration"],
        width=metadata["width"],
        height=metadata["height"],
        resolution=metadata["resolution"]
    )

    db.add(video)
    db.commit()
    db.refresh(video)

    return video


def get_all_videos(db: Session):
    return db.query(Video).all()


def get_video(db: Session, video_id: int):
    return db.query(Video).filter(Video.id == video_id).first()


def delete_video(db: Session, video_id: int):
    video = db.query(Video).filter(Video.id == video_id).first()

    if video:
        db.delete(video)
        db.commit()

    return video