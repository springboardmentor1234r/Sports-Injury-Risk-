"""
Report service — PDF, Excel, CSV report generation.
"""
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.report import Report
from app.repositories.base import BaseRepository
import os
import json
import logging

logger = logging.getLogger(__name__)


class ReportService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = BaseRepository(Report, db)

    async def generate_report(self, analysis_id: int, report_type: str,
                             format: str, generated_by: int) -> Report:
        """Generate a report in the specified format (PDF, Excel, CSV)."""
        file_path = f"reports/{analysis_id}_{report_type}.{format.lower()}"
        os.makedirs("reports", exist_ok=True)

        report = Report(
            analysis_id=analysis_id,
            generated_by=generated_by,
            report_type=report_type,
            format=format.upper(),
            file_path=file_path,
            title=f"{report_type.replace('_', ' ').title()} Report",
        )
        self.db.add(report)
        await self.db.commit()
        await self.db.refresh(report)

        # Trigger async generation
        from app.tasks.report_tasks import generate_report_task
        generate_report_task.delay(report.id)

        logger.info(f"Report generation started: {report.id}")
        return report

    async def get_report(self, report_id: int) -> Optional[Report]:
        return await self.repo.get(report_id)

    async def list_reports(self, analysis_id: int = None) -> List[Report]:
        query = select(Report)
        if analysis_id:
            query = query.where(Report.analysis_id == analysis_id)
        query = query.order_by(Report.created_at.desc())
        result = await self.db.execute(query)
        return result.scalars().all()
