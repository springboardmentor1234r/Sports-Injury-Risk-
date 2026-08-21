from fastapi import APIRouter, UploadFile, File
import shutil
import os
import cv2

from services.pose_service import process_video
from services.risk_service import assess_risk
from services.prediction_service import predict_injury_risk
from services.anomaly_service import detect_anomalies
from services.scoring_service import calculate_risk_score
from services.recommendation_service import generate_recommendations
from services.pdf_service import generate_pdf_report

router = APIRouter()

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@router.post("/upload-video")
async def upload_video(file: UploadFile = File(...)):

    # -----------------------------
    # Save uploaded video
    # -----------------------------
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # -----------------------------
    # Process Video
    # -----------------------------
    output_path = os.path.join(
        UPLOAD_FOLDER,
        "processed_" + file.filename
    )

    joint_angles = process_video(
        file_path,
        output_path
    )

    # -----------------------------
    # AI Analysis
    # -----------------------------
    risk_report = assess_risk(joint_angles)

    prediction = predict_injury_risk(joint_angles)

    anomalies = detect_anomalies(joint_angles)

    risk_score = calculate_risk_score(
        prediction,
        anomalies
    )

    recommendations = generate_recommendations(
        prediction,
        anomalies
    )

    # -----------------------------
    # Read Video Information
    # -----------------------------
    cap = cv2.VideoCapture(file_path)

    if not cap.isOpened():
        return {
            "error": "Could not open uploaded video"
        }

    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    duration = frame_count / fps if fps > 0 else 0

    # -----------------------------
    # Create Thumbnail
    # -----------------------------
    # Capture a frame around 25% into the video
    thumbnail_frame = max(1, frame_count // 4)

    cap.set(cv2.CAP_PROP_POS_FRAMES, thumbnail_frame)

    success, frame = cap.read()

    thumbnail_path = None

    if success:
        thumbnail_name = file.filename.rsplit(".", 1)[0] + "_thumbnail.jpg"
        thumbnail_path = os.path.join(UPLOAD_FOLDER, thumbnail_name)
        cv2.imwrite(thumbnail_path, frame)

    cap.release()

    video_info = {
        "width": width,
        "height": height,
        "fps": round(fps, 2),
        "total_frames": frame_count,
        "duration_seconds": round(duration, 2),
    }

    # -----------------------------
    # Generate PDF Report
    # -----------------------------
    pdf_path = generate_pdf_report(
        filename=file.filename,
        thumbnail_path=thumbnail_path,
        video_info=video_info,
        joint_angles=joint_angles,
        movement_analysis=risk_report["movement_quality"],
        injury_risk=risk_report["injury_risk"],
        injury_prediction=prediction,
        movement_anomalies=anomalies,
        risk_score=risk_score,
        recommendations=recommendations,
    )

    # -----------------------------
    # API Response
    # -----------------------------
    return {
        "message": "Video uploaded successfully",
        "filename": file.filename,
        "processed_video": output_path,
        "video_info": video_info,
        "joint_angles": joint_angles,
        "movement_analysis": risk_report["movement_quality"],
        "injury_prediction": prediction,
        "movement_anomalies": anomalies,
        "risk_score": risk_score,
        "recommendations": recommendations,
        "injury_risk": risk_report["injury_risk"],
        "report": pdf_path
    }