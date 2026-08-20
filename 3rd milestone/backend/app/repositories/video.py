from sqlalchemy.ext.asyncio import AsyncSession
from app.models.video import Video
from app.repositories.base import BaseRepository

class VideoRepository(BaseRepository[Video]):
    def __init__(self):
        super().__init__(Video)

video_repo = VideoRepository()
