from fastapi import APIRouter, Depends, HTTPException, status
from app.db.mongo import get_mongo_db
from app.models.sql_models import User, UserRole
from app.core.rbac import require_roles

router = APIRouter(prefix="/sports-scientist", tags=["Sports Science Lab Analytics"])

@router.get("/datasets", status_code=status.HTTP_200_OK)
def get_sports_scientist_datasets(
    current_user: User = Depends(require_roles([UserRole.SPORTS_SCIENTIST]))
):
    """
    Retrieve baseline dataset ingestion stats and kinematic analytics for Sports Scientists.
    """
    mongo = get_mongo_db()
    logs_col = mongo["movement_logs"]
    video_col = mongo["video_metadata"]
    reports_col = mongo["biomechanics_reports"]

    return {
        "movement_logs_count": logs_col.count_documents({}),
        "video_metadata_count": video_col.count_documents({}),
        "reports_count": reports_col.count_documents({}),
        "datasets_available": [
            {"name": "Human3.6M", "type": "3D Joint Tracking", "status": "Ingested"},
            {"name": "MPII Human Pose", "type": "Body Keypoints", "status": "Ingested"},
            {"name": "COCO Keypoints", "type": "17-Keypoint Motion", "status": "Ingested"},
            {"name": "SportsPose", "type": "Sports Movement Benchmarks", "status": "Ingested"},
            {"name": "FIFA Injury Database", "type": "Trend Metrics", "status": "Ingested"}
        ]
    }
