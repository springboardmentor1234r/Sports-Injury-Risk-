from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.video import VideoCreate
from app.repositories.video import video_repo
from app.models.video import Video

class VideoService:
    async def create_video(self, db: AsyncSession, video_in: VideoCreate) -> Video:
        return await video_repo.create(db, video_in)

video_service = VideoService()
