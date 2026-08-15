from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse, HTMLResponse
from sqlalchemy.orm import Session
import io

from app import models, auth, crud
from app.database import get_db
from app.services.report_generator import ReportGeneratorService

router = APIRouter(prefix="/api/reports", tags=["Reports Exporter"])

@router.get("/csv/{athlete_id}")
def export_csv_report(
    athlete_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Verify access: Athletes can only pull their own reports
    if current_user.role == "athlete":
        athlete = crud.get_athlete_by_user_id(db, user_id=current_user.id)
        if not athlete or athlete.id != athlete_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: Athletes can only export their own reports."
            )
            
    csv_content = ReportGeneratorService.generate_csv_report(db, athlete_id)
    if not csv_content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete profile not found or holds no log data."
        )
        
    # Return as streamable attachment file download
    file_stream = io.BytesIO(csv_content.encode("utf-8"))
    return StreamingResponse(
        file_stream,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=athlete_report_{athlete_id}.csv"
        }
    )

@router.get("/pdf/{athlete_id}", response_class=HTMLResponse)
def export_html_report(
    athlete_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Verify access
    if current_user.role == "athlete":
        athlete = crud.get_athlete_by_user_id(db, user_id=current_user.id)
        if not athlete or athlete.id != athlete_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: Athletes can only export their own reports."
            )
            
    html_content = ReportGeneratorService.generate_html_report(db, athlete_id)
    return HTMLResponse(content=html_content, status_code=200)
