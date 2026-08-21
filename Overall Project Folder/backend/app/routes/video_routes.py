import os
import uuid
import shutil
from datetime import datetime
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from app.config import settings
from app.schemas import VideoAnalysisResponse, BiomechanicalMetrics, InjuryPredictionResult, AnomalyResult, RecommendationItem
from app.database import get_db
from app.dependencies import get_current_user, verify_athlete_access

from app.engines.pose_estimation_engine import pose_engine
from app.engines.biomechanical_analysis_engine import biomechanics_engine
from app.engines.ml_prediction_engine import ml_prediction_engine
from app.engines.anomaly_detection_engine import anomaly_engine
from app.engines.risk_scoring_engine import risk_scoring_engine
from app.engines.ai_recommendation_agent import ai_recommendation_agent
from app.models import create_notification_model

router = APIRouter(prefix="/api/videos", tags=["Video Analysis"])

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".webm"}

@router.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: MP4, MOV, AVI, WEBM"
        )

    # Read contents to check file size limit (max 200 MB)
    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > settings.MAX_UPLOAD_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size ({size_mb:.1f} MB) exceeds maximum allowed size ({settings.MAX_UPLOAD_SIZE_MB} MB)."
        )

    filename = f"{uuid.uuid4().hex}_{file.filename}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    return {
        "filename": file.filename,
        "saved_name": filename,
        "file_url": f"/uploads/{filename}",
        "size_mb": round(size_mb, 2),
        "status": "Uploaded Successfully"
    }


@router.post("/analyze", response_model=VideoAnalysisResponse)
async def analyze_video(
    athlete_id: str = Form(...),
    video_name: str = Form(...),
    video_filename: Optional[str] = Form(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Full Video Processing & AI Injury Risk Pipeline:
    1. Pose estimation keypoint extraction
    2. Biomechanical joint angle analysis
    3. IsolationForest anomaly detection
    4. 6 Random Forest injury predictions
    5. Weighted risk scoring (35/20/20/15/10 formula)
    6. AI recommendation generation
    7. Notification drawer alert creation
    8. Persists analysis to database
    """
    # Verify strict data isolation for athlete role
    await verify_athlete_access(athlete_id, current_user)

    db = get_db()
    athletes_coll = db.get_collection("athletes")
    analyses_coll = db.get_collection("analyses")
    recs_coll = db.get_collection("recommendations")
    notif_coll = db.get_collection("notifications")
    reports_coll = db.get_collection("reports")

    athlete = await athletes_coll.find_one({"id": athlete_id})
    if not athlete:
        athlete = await athletes_coll.find_one({"_id": athlete_id})
    
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete profile not found.")

    athlete_name = athlete.get("name", "Unknown Athlete")
    video_path = os.path.join(settings.UPLOAD_DIR, video_filename) if video_filename else ""

    # Step 1: Pose Estimation Engine
    pose_data = pose_engine.process_video_frames(video_path)

    # Step 2: Biomechanical Analysis Engine
    biomechanics = biomechanics_engine.analyze_pose_series(pose_data)

    # Step 3: IsolationForest Anomaly Detection
    anomaly_result = anomaly_engine.detect_anomalies(biomechanics, pose_data)

    # Step 4: 6 Random Forest Injury Predictions
    predictions = ml_prediction_engine.predict_injury_risks(biomechanics, athlete)

    # Step 5: Weighted Risk Scoring Engine
    risk_summary = risk_scoring_engine.calculate_overall_risk(
        biomechanics=biomechanics,
        predictions=predictions,
        anomaly=anomaly_result,
        athlete_meta=athlete
    )

    analysis_id = str(uuid.uuid4())
    now_str = datetime.utcnow().isoformat()

    # Step 6: AI Recommendation Agent
    recommendations_list = ai_recommendation_agent.generate_recommendations(
        athlete_id=athlete_id,
        analysis_id=analysis_id,
        biomechanics=biomechanics,
        predictions=predictions,
        risk_scoring=risk_summary
    )

    # Save recommendations to database
    for r in recommendations_list:
        r["created_at"] = now_str
        await recs_coll.insert_one(r)

    # Step 7: Create Notification
    overall_risk = risk_summary["overall_risk_score"]
    risk_level = risk_summary["risk_level"]
    notif_priority = "Critical" if overall_risk > 65 else ("Warning" if overall_risk > 35 else "Info")
    notif = create_notification_model(
        user_id=athlete.get("user_id") or current_user.get("id"),
        title=f"Analysis Complete: {risk_level} ({overall_risk}/100)",
        message=f"Biomechanical analysis for {video_name} detected {biomechanics.get('knee_valgus')} with {predictions.get('acl_risk')}% ACL risk.",
        priority=notif_priority
    )
    await notif_coll.insert_one(notif)

    # Step 8: Build Analysis Record & Save to DB
    analysis_record = {
        "_id": analysis_id,
        "id": analysis_id,
        "athlete_id": athlete_id,
        "athlete_name": athlete_name,
        "video_name": video_name,
        "video_url": f"/uploads/{video_filename}" if video_filename else "/uploads/demo_video.mp4",
        "frames_analyzed": pose_data.get("total_frames", 120),
        "analysis_date": now_str,
        "overall_risk_score": overall_risk,
        "risk_level": risk_level,
        "movement_quality_score": risk_summary["movement_quality_score"],
        "biomechanical_efficiency_score": risk_summary["biomechanical_efficiency_score"],
        "fatigue_risk_score": risk_summary["fatigue_risk_score"],
        "overall_health_score": risk_summary["overall_health_score"],
        "biomechanics": biomechanics,
        "injury_predictions": predictions,
        "anomaly_detection": anomaly_result,
        "recommendations": recommendations_list,
        "created_at": now_str
    }
    await analyses_coll.insert_one(analysis_record)

    # Update Athlete's latest stats in DB
    sessions_count = (athlete.get("sessions_analyzed") or 0) + 1
    await athletes_coll.update_one(
        {"id": athlete_id},
        {"$set": {
            "recent_risk_score": overall_risk,
            "risk_level": risk_level,
            "movement_quality_score": risk_summary["movement_quality_score"],
            "overall_health_score": risk_summary["overall_health_score"],
            "sessions_analyzed": sessions_count
        }}
    )

    # Step 9: Save Report metadata
    report_record = {
        "_id": str(uuid.uuid4()),
        "id": str(uuid.uuid4()),
        "athlete_id": athlete_id,
        "athlete_name": athlete_name,
        "analysis_id": analysis_id,
        "video_name": video_name,
        "generated_at": now_str,
        "overall_risk_score": overall_risk,
        "risk_level": risk_level,
        "summary": f"Video analysis performed on {video_name}. Overall injury risk is {overall_risk}/100 ({risk_level}). Primary risk: {anomaly_result.get('description')}",
        "download_url": f"/api/reports/{analysis_id}"
    }
    await reports_coll.insert_one(report_record)

    # Return typed response
    return VideoAnalysisResponse(
        id=analysis_id,
        athlete_id=athlete_id,
        athlete_name=athlete_name,
        video_name=video_name,
        video_url=analysis_record["video_url"],
        frames_analyzed=analysis_record["frames_analyzed"],
        analysis_date=now_str,
        overall_risk_score=overall_risk,
        risk_level=risk_level,
        movement_quality_score=risk_summary["movement_quality_score"],
        biomechanical_efficiency_score=risk_summary["biomechanical_efficiency_score"],
        fatigue_risk_score=risk_summary["fatigue_risk_score"],
        overall_health_score=risk_summary["overall_health_score"],
        biomechanics=BiomechanicalMetrics(**biomechanics),
        injury_predictions=InjuryPredictionResult(**predictions),
        anomaly_detection=AnomalyResult(**anomaly_result),
        recommendations=[RecommendationItem(**r) for r in recommendations_list]
    )
