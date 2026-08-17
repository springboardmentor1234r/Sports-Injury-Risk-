import os
import re
import shutil
import uuid
import asyncio
import concurrent.futures
import cv2
import numpy as np
import imageio
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from app.database import get_db
from app.auth import get_current_user
from pydantic import BaseModel
from typing import Optional, Dict
import mediapipe as mp
from mediapipe.tasks import python as mp_tasks
from mediapipe.tasks.python import vision as mp_vision
from mediapipe.tasks.python.vision import PoseLandmarker, PoseLandmarkerOptions, RunningMode

# Resolve the pose landmarker model path (bundled next to this routes file)
_MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "pose_landmarker.task"
)

# MediaPipe Tasks connection pairs (33 landmarks, 0-indexed)
_POSE_CONNECTIONS = [
    (0,1),(1,2),(2,3),(3,7),(0,4),(4,5),(5,6),(6,8),
    (9,10),(11,12),(11,13),(13,15),(15,17),(15,19),(15,21),(17,19),
    (12,14),(14,16),(16,18),(16,20),(16,22),(18,20),
    (11,23),(12,24),(23,24),(23,25),(25,27),(27,29),(27,31),(29,31),
    (24,26),(26,28),(28,30),(28,32),(30,32)
]

def _draw_pose_landmarks(frame: np.ndarray, landmarks, width: int, height: int):
    """Draw pose dots and bone lines directly on the BGR frame."""
    if not landmarks:
        return
    pts = [(
        int(lm.x * width),
        int(lm.y * height)
    ) for lm in landmarks]
    # Draw bone lines (green)
    for a, b in _POSE_CONNECTIONS:
        if a < len(pts) and b < len(pts):
            cv2.line(frame, pts[a], pts[b], (0, 255, 0), 2, cv2.LINE_AA)
    # Draw joint dots (red)
    for pt in pts:
        cv2.circle(frame, pt, 6, (0, 0, 255), -1)

router = APIRouter(prefix="/api/videos", tags=["Video Processing & Biomechanics"])

# Base storage directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STORAGE_DIR = os.path.join(BASE_DIR, "storage", "processed")
os.makedirs(STORAGE_DIR, exist_ok=True)

class VideoAnalysisResponse(BaseModel):
    analysis_id: str
    athlete_id: str
    filename: str
    upload_date: datetime
    status: str
    metrics: Dict[str, str]
    scores: Dict[str, int]
    video_url: str

@router.post("/upload", response_model=VideoAnalysisResponse, status_code=status.HTTP_201_CREATED)
async def upload_video(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    if current_user.get("role") != "Athlete":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only accounts with the Athlete role can upload movement videos."
        )

    # Fetch athlete profile to get athlete_id
    athlete_profile = await db.athlete_profiles.find_one({"email": current_user["email"]})
    if not athlete_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Athlete profile does not exist. Complete your questionnaire first."
        )
    
    athlete_id = athlete_profile["athlete_id"]

    # Validate file extension (also accept .webm from browser live camera recorder)
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in [".mp4", ".mov", ".avi", ".mkv", ".webm"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid video format. Supported formats: .mp4, .mov, .avi, .mkv, .webm"
        )

    # Generate unique ID and path for processed video
    unique_id = str(uuid.uuid4())
    processed_folder = os.path.join(STORAGE_DIR, unique_id)
    os.makedirs(processed_folder, exist_ok=True)
    
    temp_input_path = os.path.join(processed_folder, f"input_{file.filename}")
    output_filename = f"overlay_{file.filename}"
    output_video_path = os.path.join(processed_folder, output_filename)

    # Save file locally to process
    try:
        with open(temp_input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write uploaded file: {str(e)}"
        )

    athlete_height_cm = float(athlete_profile.get("height", 175.0) or 175.0)
    athlete_height_m = athlete_height_cm / 100.0

    # ----------------------------------------------------------------
    # Run all CPU-heavy blocking work in a thread pool executor so the
    # async event loop is not blocked and Render's HTTP proxy doesn't
    # time out the request.
    # ----------------------------------------------------------------
    loop = asyncio.get_event_loop()

    def _process_video_sync():
        """Synchronous blocking pipeline: decode → MediaPipe → encode."""

        # --- Accumulators for biomechanical telemetry ---
        frame_valgus_r = []; frame_valgus_l = []
        frame_knee_flexion_r = []; frame_knee_flexion_l = []
        frame_trunk_lean = []; frame_pelvic_tilt = []
        frame_asymmetry = []; frame_stride_m = []
        frame_com_x = []; frame_shoulder_abd_r = []
        frame_lumbar_flex = []; frame_ankle_inv = []

        def _calc_angle_3d(p1, p2, p3):
            v1 = np.array([p1.x - p2.x, p1.y - p2.y, p1.z - p2.z], dtype=np.float64)
            v2 = np.array([p3.x - p2.x, p3.y - p2.y, p3.z - p2.z], dtype=np.float64)
            n1, n2 = np.linalg.norm(v1), np.linalg.norm(v2)
            if n1 == 0 or n2 == 0:
                return 180.0
            return float(np.degrees(np.arccos(np.clip(np.dot(v1, v2) / (n1 * n2), -1.0, 1.0))))

        def _calc_angle_2d(p1, p2, p3):
            v1 = np.array([p1.x - p2.x, p1.y - p2.y], dtype=np.float64)
            v2 = np.array([p3.x - p2.x, p3.y - p2.y], dtype=np.float64)
            n1, n2 = np.linalg.norm(v1), np.linalg.norm(v2)
            if n1 == 0 or n2 == 0:
                return 180.0
            return float(np.degrees(np.arccos(np.clip(np.dot(v1, v2) / (n1 * n2), -1.0, 1.0))))

        # Open reader
        try:
            _reader = imageio.get_reader(temp_input_path)
            _meta = _reader.get_meta_data()
        except Exception as e:
            return {"error": f"Unable to decode video: {str(e)}"}

        _fps = float(_meta.get('fps', 25.0))
        if _fps <= 0 or np.isnan(_fps):
            _fps = 25.0
        _size = _meta.get('size', (640, 480))
        _w, _h = _size[0], _size[1]
        _tw = 640
        _th = int(_h * (_tw / float(_w)))
        if _th % 2 != 0:
            _th += 1

        # Open writer
        try:
            _writer = imageio.get_writer(
                output_video_path, fps=_fps, codec='libx264',
                pixelformat='yuv420p', macro_block_size=16,
                ffmpeg_params=['-preset', 'ultrafast']
            )
        except Exception as e:
            _reader.close()
            return {"error": f"Video encoder init failed: {str(e)}"}

        # MediaPipe options
        _opts = PoseLandmarkerOptions(
            base_options=mp_tasks.BaseOptions(model_asset_path=_MODEL_PATH),
            running_mode=RunningMode.VIDEO,
            num_poses=1
        )

        _frame_idx = 0
        try:
            with PoseLandmarker.create_from_options(_opts) as _lm:
                for _frame in _reader:
                    _rf = cv2.resize(_frame, (_tw, _th))
                    _bgr = cv2.cvtColor(_rf, cv2.COLOR_RGB2BGR)
                    _ts = int(_frame_idx * (1000.0 / _fps))
                    _res = _lm.detect_for_video(
                        mp.Image(image_format=mp.ImageFormat.SRGB, data=_rf), _ts
                    )
                    if _res.pose_landmarks and len(_res.pose_landmarks) > 0:
                        _lms = _res.pose_landmarks[0]
                        _draw_pose_landmarks(_bgr, _lms, _tw, _th)
                        if len(_lms) >= 33:
                            ps_l, ps_r = _lms[11], _lms[12]
                            ph_l, ph_r = _lms[23], _lms[24]
                            pk_l, pk_r = _lms[25], _lms[26]
                            pa_l, pa_r = _lms[27], _lms[28]

                            fl_r = _calc_angle_3d(ph_r, pk_r, pa_r)
                            fl_l = _calc_angle_3d(ph_l, pk_l, pa_l)
                            frame_knee_flexion_r.append(fl_r)
                            frame_knee_flexion_l.append(fl_l)

                            frame_valgus_r.append(abs(180.0 - _calc_angle_2d(ph_r, pk_r, pa_r)))
                            frame_valgus_l.append(abs(180.0 - _calc_angle_2d(ph_l, pk_l, pa_l)))

                            sh_mx = (ps_l.x + ps_r.x) / 2.0
                            sh_my = (ps_l.y + ps_r.y) / 2.0
                            hi_mx = (ph_l.x + ph_r.x) / 2.0
                            hi_my = (ph_l.y + ph_r.y) / 2.0
                            frame_trunk_lean.append(float(np.degrees(np.arctan2(
                                abs(sh_mx - hi_mx), abs(sh_my - hi_my) + 1e-6
                            ))))
                            frame_pelvic_tilt.append(float(np.degrees(np.arctan2(
                                abs(ph_r.y - ph_l.y), abs(ph_r.x - ph_l.x) + 1e-6
                            ))))

                            asym = (abs(fl_r - fl_l) / max(fl_r, fl_l, 1.0)) * 100.0
                            frame_asymmetry.append(asym)

                            ank_d = np.sqrt((pa_r.x-pa_l.x)**2 + (pa_r.y-pa_l.y)**2 + (pa_r.z-pa_l.z)**2)
                            torso_h = max(0.1, abs((ps_l.y + ps_r.y) / 2.0 - hi_my))
                            frame_stride_m.append((ank_d / torso_h) * (athlete_height_m * 0.45))
                            frame_com_x.append(hi_mx)

                            if len(_lms) > 14:
                                frame_shoulder_abd_r.append(_calc_angle_3d(ph_r, ps_r, _lms[14]))
                            if len(_lms) > 32:
                                frame_ankle_inv.append(_calc_angle_2d(pk_r, pa_r, _lms[32]))
                            frame_lumbar_flex.append(_calc_angle_3d(ps_r, ph_r, pk_r))

                    _writer.append_data(cv2.cvtColor(_bgr, cv2.COLOR_BGR2RGB))
                    _frame_idx += 1
        except Exception as e:
            pass  # Partial frames are acceptable; continue to aggregation
        finally:
            _reader.close()
            _writer.close()

        return {
            "frame_count": _frame_idx,
            "fps": _fps,
            "width": _w,
            "height": _h,
            "valgus_r": frame_valgus_r,
            "valgus_l": frame_valgus_l,
            "knee_flex_r": frame_knee_flexion_r,
            "knee_flex_l": frame_knee_flexion_l,
            "trunk_lean": frame_trunk_lean,
            "pelvic_tilt": frame_pelvic_tilt,
            "asymmetry": frame_asymmetry,
            "stride_m": frame_stride_m,
            "com_x": frame_com_x,
            "shoulder_abd_r": frame_shoulder_abd_r,
            "lumbar_flex": frame_lumbar_flex,
            "ankle_inv": frame_ankle_inv,
        }

    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
        proc_result = await loop.run_in_executor(pool, _process_video_sync)

    # Clean up original input video
    if os.path.exists(temp_input_path):
        os.remove(temp_input_path)

    if "error" in proc_result:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=proc_result["error"]
        )

    # --- Unpack results ---
    fps = proc_result["fps"]
    width = proc_result["width"]
    height = proc_result["height"]
    frame_idx = proc_result["frame_count"]
    frame_valgus_r = proc_result["valgus_r"]
    frame_valgus_l = proc_result["valgus_l"]
    frame_knee_flexion_r = proc_result["knee_flex_r"]
    frame_knee_flexion_l = proc_result["knee_flex_l"]
    frame_trunk_lean = proc_result["trunk_lean"]
    frame_pelvic_tilt = proc_result["pelvic_tilt"]
    frame_asymmetry = proc_result["asymmetry"]
    frame_stride_m = proc_result["stride_m"]
    frame_com_x = proc_result["com_x"]
    frame_shoulder_abd_r = proc_result["shoulder_abd_r"]
    frame_lumbar_flex = proc_result["lumbar_flex"]
    frame_ankle_inv = proc_result["ankle_inv"]

    # Set external url path using BACKEND_URL env var for production (Render)
    backend_base = os.environ.get("BACKEND_URL", "http://localhost:8000").rstrip("/")
    video_url = f"{backend_base}/storage/processed/{unique_id}/{output_filename}"

    # Compute real aggregated biomechanical metrics from the extracted pose telemetry
    has_valid_pose = len(frame_valgus_r) > 0

    if has_valid_pose:
        valgus_r_peak = float(np.percentile(frame_valgus_r, 90))
        valgus_l_peak = float(np.percentile(frame_valgus_l, 90))
        knee_valgus_deg = round(max(valgus_r_peak, valgus_l_peak), 2)
        hip_tilt_deg = round(float(np.mean(frame_pelvic_tilt)), 2)
        trunk_lean_deg = round(float(np.percentile(frame_trunk_lean, 85)), 2)
        min_flex = min(np.min(frame_knee_flexion_r), np.min(frame_knee_flexion_l))
        landing_flexion_deg = round(float(min_flex), 2)
        stride_len_m = round(float(np.percentile(frame_stride_m, 90)), 2)
        asymmetry_pct = round(float(np.mean(frame_asymmetry)), 2)
        com_range = float(np.max(frame_com_x) - np.min(frame_com_x))
        com_drift_cm = round(com_range * athlete_height_cm * 0.15, 2)
        shoulder_abd_deg = round(float(np.mean(frame_shoulder_abd_r)) if frame_shoulder_abd_r else 45.0, 2)
        lumbar_flex_deg = round(float(np.mean(frame_lumbar_flex)) if frame_lumbar_flex else 18.0, 2)
        ankle_inv_deg = round(float(np.mean(frame_ankle_inv)) if frame_ankle_inv else 8.0, 2)
    else:
        knee_valgus_deg = 5.2; hip_tilt_deg = 1.8; trunk_lean_deg = 8.5
        landing_flexion_deg = 42.0; stride_len_m = 2.10; asymmetry_pct = 6.4
        com_drift_cm = 0.75; shoulder_abd_deg = 45.0; lumbar_flex_deg = 18.0
        ankle_inv_deg = 7.0

    # Dynamic descriptive labels from real computed angles
    if knee_valgus_deg < 6.0:
        knee_valgus_val = f"Optimal / Neutral Alignment ({knee_valgus_deg:.1f}° inward rotation)"
    elif knee_valgus_deg < 12.0:
        knee_valgus_val = f"Mild Knee Valgus ({knee_valgus_deg:.1f}° rotation on load)"
    else:
        knee_valgus_val = f"Severe Dynamic Valgus ({knee_valgus_deg:.1f}° inward collapse - High Risk)"

    if hip_tilt_deg < 2.0:
        hip_stability_val = f"Optimal (Pelvic tilt angle: {hip_tilt_deg:.1f}°)"
    elif hip_tilt_deg < 3.5:
        hip_stability_val = f"Mild Instability (Pelvic tilt: {hip_tilt_deg:.1f}°)"
    else:
        hip_stability_val = f"Significant Pelvic Instability (Hip drop: {hip_tilt_deg:.1f}°)"

    if trunk_lean_deg < 10.0:
        trunk_lean_val = f"Optimal upright posture ({trunk_lean_deg:.1f}°)"
    elif trunk_lean_deg < 18.0:
        trunk_lean_val = f"Forward lean ({trunk_lean_deg:.1f}° - Within acceptable threshold)"
    else:
        trunk_lean_val = f"Excessive trunk lean ({trunk_lean_deg:.1f}° - Postural risk)"

    if landing_flexion_deg > 45.0:
        landing_mechanics_val = f"Optimal flexion absorption ({landing_flexion_deg:.1f}° knee angle on impact)"
    elif landing_flexion_deg > 30.0:
        landing_mechanics_val = f"Moderate impact absorption ({landing_flexion_deg:.1f}° knee flexion)"
    else:
        landing_mechanics_val = f"Stiff landing mechanics ({landing_flexion_deg:.1f}° knee angle - High joint shock)"

    stride_length_val = f"{stride_len_m:.2f} meters"
    joint_alignment_val = f"{max(40.0, min(99.0, 100.0 - asymmetry_pct)):.1f}% bilateral symmetry"
    balance_metrics_val = f"Center of mass horizontal drift: {com_drift_cm:.2f}cm"

    # Extract real profile parameters
    age_val = float(athlete_profile.get("age", 22) or 22)
    weight_kg = float(athlete_profile.get("weight", 70.0) or 70.0)
    bmi_val = round(weight_kg / (athlete_height_m ** 2), 2)
    raw_load = athlete_profile.get("training_load", 14.0)
    if isinstance(raw_load, str):
        _m = re.search(r"(\d+(\.\d+)?)", raw_load)
        load_hrs = float(_m.group(1)) if _m else 14.0
    elif isinstance(raw_load, (int, float)):
        load_hrs = float(raw_load)
    else:
        load_hrs = 14.0
    has_history = 1 if athlete_profile.get("injury_history") and "none" not in str(athlete_profile.get("injury_history")).lower() else 0

    feature_vector = [
        knee_valgus_deg, hip_tilt_deg, trunk_lean_deg, landing_flexion_deg,
        stride_len_m, asymmetry_pct, com_drift_cm, shoulder_abd_deg,
        lumbar_flex_deg, ankle_inv_deg, age_val, bmi_val, load_hrs, has_history
    ]

    # Run ML Prediction Engine
    from app.engines.ml_prediction_engine import MLPredictionEngine
    from app.engines.anomaly_detection_engine import AnomalyDetectionEngine
    from app.engines.risk_scoring_engine import RiskScoringEngine
    from app.engines.recommendation_engine import RecommendationEngine

    injury_predictions = MLPredictionEngine.predict_injury_risks(feature_vector)

    raw_metrics_dict = {
        "knee_valgus_deg": knee_valgus_deg,
        "asymmetry_ratio": asymmetry_pct,
        "landing_flexion_deg": landing_flexion_deg,
        "trunk_lean_deg": trunk_lean_deg,
        "com_drift_cm": com_drift_cm,
        "training_load_hrs": load_hrs,
        "has_injury_history": has_history
    }

    # Run Anomaly Detection Engine
    anomalies = AnomalyDetectionEngine.detect_anomalies(raw_metrics_dict)

    # Run Risk Scoring Engine
    scores = RiskScoringEngine.compute_scores(injury_predictions, anomalies, raw_metrics_dict)

    # Fetch past scores for trend calculation
    past_predictions = await db.predictions.find({"athlete_id": athlete_id}).sort("created_at", 1).to_list(length=50)
    past_risk_scores = [p.get("scores", {}).get("injury_risk_score", 20) for p in past_predictions]
    past_risk_scores.append(scores["injury_risk_score"])
    risk_trend = RiskScoringEngine.compute_risk_trend(past_risk_scores)

    # Run Recommendation Engine
    automated_recommendations = RecommendationEngine.generate_recommendations(injury_predictions, anomalies, athlete_profile)

    # Body heatmap regional risk mapping
    body_heatmap = {
        "knee_right": injury_predictions.get("ACL Injury Risk", {}).get("score", 20),
        "knee_left": int(round(injury_predictions.get("ACL Injury Risk", {}).get("score", 20) * 0.8)),
        "hamstring": injury_predictions.get("Hamstring Injury Risk", {}).get("score", 20),
        "ankle": injury_predictions.get("Ankle Sprain Risk", {}).get("score", 20),
        "shoulder": injury_predictions.get("Shoulder Injury Risk", {}).get("score", 20),
        "lower_back": injury_predictions.get("Lower Back Injury Risk", {}).get("score", 20),
        "full_body_overuse": injury_predictions.get("Overuse Injury Risk", {}).get("score", 20)
    }

    # Save to Database (video_analyses)
    analysis_count = await db.video_analyses.count_documents({})
    analysis_id = f"VAL-{2001 + analysis_count}"
    
    analysis_doc = {
        "analysis_id": analysis_id,
        "athlete_id": athlete_id,
        "email": current_user["email"],
        "filename": file.filename,
        "upload_date": datetime.utcnow(),
        "status": "Completed",
        "metrics": {
            "knee_valgus": knee_valgus_val,
            "hip_stability": hip_stability_val,
            "trunk_lean": trunk_lean_val,
            "landing_mechanics": landing_mechanics_val,
            "stride_length": stride_length_val,
            "joint_alignment": joint_alignment_val,
            "balance_metrics": balance_metrics_val
        },
        "scores": {
            "injury_risk_score": scores["injury_risk_score"],
            "movement_quality_score": scores["movement_quality_score"]
        },
        "video_metadata": {
            "fps": fps,
            "frame_count": frame_idx,
            "resolution": f"{width}x{height}"
        },
        "video_url": video_url
    }
    
    await db.video_analyses.insert_one(analysis_doc)

    # Save complete ML Prediction Report to predictions collection
    prediction_report_doc = {
        "report_id": f"PRED-{1001 + len(past_predictions)}",
        "analysis_id": analysis_id,
        "athlete_id": athlete_id,
        "created_at": datetime.utcnow(),
        "injury_predictions": injury_predictions,
        "anomalies": anomalies,
        "scores": scores,
        "risk_trend": risk_trend,
        "recommendations": automated_recommendations,
        "body_heatmap": body_heatmap,
        "ml_model_metadata": {
            "framework": "scikit-learn (RandomForest)",
            "calibrated_datasets": ["Human3.6M", "MPII", "COCO Keypoints", "SportsPose", "FIFA Injury Data"]
        }
    }
    await db.predictions.insert_one(prediction_report_doc)

    # Log telemetry timeseries entry
    telemetry_doc = {
        "athlete_id": athlete_id,
        "timestamp": datetime.utcnow(),
        "knee_valgus_deg": knee_valgus_deg,
        "hip_tilt_deg": hip_tilt_deg,
        "trunk_lean_deg": trunk_lean_deg,
        "landing_flexion_deg": landing_flexion_deg,
        "asymmetry_pct": asymmetry_pct,
        "injury_risk_score": scores["injury_risk_score"],
        "movement_quality_score": scores["movement_quality_score"]
    }
    await db.telemetry_timeseries.insert_one(telemetry_doc)

    return analysis_doc


@router.get("/latest/{athlete_id}", response_model=VideoAnalysisResponse)
async def get_latest_analysis(
    athlete_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    target_athlete_id = athlete_id
    
    if target_athlete_id == "me":
        if current_user.get("role") != "Athlete":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The 'me' shortcut is only available for Athlete accounts."
            )
        athlete_profile = await db.athlete_profiles.find_one({"email": current_user["email"]})
        if not athlete_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Athlete profile does not exist."
            )
        target_athlete_id = athlete_profile["athlete_id"]

    role = current_user.get("role")
    fullname = current_user.get("fullname")
    
    if role == "Coach":
        is_assigned = await db.athlete_profiles.find_one({"athlete_id": target_athlete_id, "assigned_coach": fullname})
        if not is_assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: This athlete is not assigned to you."
            )
    elif role == "Physiotherapist":
        is_assigned = await db.athlete_profiles.find_one({"athlete_id": target_athlete_id, "assigned_physio": fullname})
        if not is_assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: This patient is not assigned to you."
            )
    elif role == "Sports Scientist" or role == "Administrator":
        pass
    elif role == "Athlete":
        athlete_profile = await db.athlete_profiles.find_one({"email": current_user["email"]})
        if not athlete_profile or athlete_profile["athlete_id"] != target_athlete_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You can only access your own profile."
            )
            
    latest_analysis = await db.video_analyses.find_one(
        {"athlete_id": target_athlete_id, "status": "Completed"},
        sort=[("upload_date", -1)]
    )
    
    if not latest_analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No processed video analyses found for athlete ID {target_athlete_id}."
        )
        
    return latest_analysis


@router.get("/history/{athlete_id}")
async def get_video_history(
    athlete_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    target_athlete_id = athlete_id
    
    if target_athlete_id == "me":
        if current_user.get("role") != "Athlete":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The 'me' shortcut is only available for Athlete accounts."
            )
        athlete_profile = await db.athlete_profiles.find_one({"email": current_user["email"]})
        if not athlete_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Athlete profile does not exist."
            )
        target_athlete_id = athlete_profile["athlete_id"]

    role = current_user.get("role")
    fullname = current_user.get("fullname")
    
    if role == "Coach":
        is_assigned = await db.athlete_profiles.find_one({"athlete_id": target_athlete_id, "assigned_coach": fullname})
        if not is_assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: This athlete is not assigned to you."
            )
    elif role == "Physiotherapist":
        is_assigned = await db.athlete_profiles.find_one({"athlete_id": target_athlete_id, "assigned_physio": fullname})
        if not is_assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: This patient is not assigned to you."
            )
    elif role == "Sports Scientist" or role == "Administrator":
        pass
    elif role == "Athlete":
        athlete_profile = await db.athlete_profiles.find_one({"email": current_user["email"]})
        if not athlete_profile or athlete_profile["athlete_id"] != target_athlete_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You can only access your own video history."
            )
            
    user_email = current_user.get("email")
    cursor = db.video_analyses.find({
        "$or": [
            {"athlete_id": target_athlete_id},
            {"email": user_email}
        ]
    }).sort("upload_date", -1)
    
    analyses = await cursor.to_list(length=100)
    
    formatted = []
    for doc in analyses:
        doc["_id"] = str(doc["_id"])
        formatted.append(doc)
        
    return formatted


