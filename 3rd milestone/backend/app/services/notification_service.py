"""
Notification service — email, push, SMS notifications.
"""
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.notification import Notification
from app.repositories.base import BaseRepository
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = BaseRepository(Notification, db)

    async def create_notification(self, user_id: int, notification_type: str,
                                 title: str, message: str,
                                 priority: str = "NORMAL",
                                 action_url: str = None) -> Notification:
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message,
            priority=priority,
            action_url=action_url,
        )
        self.db.add(notification)
        await self.db.commit()
        await self.db.refresh(notification)

        # Trigger async delivery
        from app.tasks.notification_tasks import send_notification
        send_notification.delay(notification.id)

        return notification

    async def get_user_notifications(self, user_id: int,
                                    unread_only: bool = False) -> List[Notification]:
        query = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            query = query.where(Notification.is_read == False)
        query = query.order_by(Notification.sent_at.desc())
        result = await self.db.execute(query)
        return result.scalars().all()

    async def mark_read(self, notification_id: int) -> Optional[Notification]:
        notification = await self.repo.get(notification_id)
        if notification:
            notification.is_read = True
            await self.db.commit()
        return notification

    async def mark_all_read(self, user_id: int) -> int:
        result = await self.db.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)
            .values(is_read=True)
        )
        await self.db.commit()
        return result.rowcount

    async def send_risk_alert(self, user_id: int, risk_level: str,
                             risk_score: float, analysis_id: int):
        """Send high-risk alert notification."""
        if risk_level in ('HIGH', 'CRITICAL'):
            await self.create_notification(
                user_id=user_id,
                notification_type='RISK_ALERT',
                title=f'{risk_level} Injury Risk Detected',
                message=f'Risk score: {risk_score:.1f}/100. Immediate attention recommended.',
                priority='HIGH',
                action_url=f'/analysis/{analysis_id}',
            )
