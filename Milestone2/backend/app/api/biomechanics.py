from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.db.mongo import get_mongo_db
from app.ml.pose_estimator import process_and_store_pose_estimation
from app.ml.kinematics import BiomechanicalKinematicsEngine
from app.models.sql_models import User, PhysicalAssessmentRecord
from app.db.postgres import get_db
from sqlalchemy.orm import Session
from app.core.rbac import get_optional_current_user

router = APIRouter(prefix="/biomechanics", tags=["Biomechanical Analysis Engine"])

@router.post("/analyze/{video_id}", status_code=status.HTTP_200_OK)
def analyze_video_biomechanics(
    video_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Triggers MediaPipe pose landmark extraction, moving average spatial smoothing,
    and kinematic vector calculations for video_id. Stores results in MongoDB and SQL.
    """
    # 1. Trigger Pose Estimation Engine
    movement_log = process_and_store_pose_estimation(video_id)

    # 2. Trigger Kinematics Engine
    engine = BiomechanicalKinematicsEngine()
    report = engine.analyze_movement_log(movement_log)

    # 3. Persist to MongoDB biomechanics_reports collection
    mongo = get_mongo_db()
    reports_col = mongo["biomechanics_reports"]
    
    existing = reports_col.find_one({"video_id": video_id})
    if existing:
        if hasattr(reports_col, "replace_one"):
            reports_col.replace_one({"video_id": video_id}, report)
        else:
            reports_col.documents = [d for d in reports_col.documents if d.get("video_id") != video_id]
            reports_col.insert_one(report)
    else:
        reports_col.insert_one(report)

    # Convert internal _id to string for FastAPI JSON serialization
    if "_id" in report:
        report["_id"] = str(report["_id"])

    # 4. If authenticated, log physical assessment record in SQL DB
    if current_user:
        try:
            clean_summary = {}
            for k, v in report["summary_metrics"].items():
                if isinstance(v, (int, float, str, bool)):
                    clean_summary[k] = v
                else:
                    clean_summary[k] = str(v)

            assessment = PhysicalAssessmentRecord(
                user_id=current_user.user_id,
                metrics_summary=clean_summary
            )
            db.add(assessment)
            db.commit()
        except Exception as sql_err:
            db.rollback()
            print(f"SQL assessment record save notice: {sql_err}")

    return {
        "status": "success",
        "message": f"Biomechanical analysis completed for video {video_id}",
        "report": report
    }

@router.get("/metrics/{video_id}", status_code=status.HTTP_200_OK)
def get_biomechanics_metrics(video_id: str, current_user: Optional[User] = Depends(get_optional_current_user)):
    """
    Returns generated biomechanical indicators, joint angles time series,
    movement symmetry index, and risk alerts for video_id.
    """
    mongo = get_mongo_db()
    report = mongo["biomechanics_reports"].find_one({"video_id": video_id})

    # If report not generated yet, trigger analyze on-the-fly
    if not report:
        try:
            movement_log = process_and_store_pose_estimation(video_id)
            engine = BiomechanicalKinematicsEngine()
            report = engine.analyze_movement_log(movement_log)
            mongo["biomechanics_reports"].insert_one(report)
        except Exception as err:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Analysis report for video '{video_id}' could not be loaded: {str(err)}"
            )

    report_copy = dict(report)
    if "_id" in report_copy:
        report_copy["_id"] = str(report_copy["_id"])

    return report_copy
