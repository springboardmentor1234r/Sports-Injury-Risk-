"""
Milestone 2 core: pose estimation + basic biomechanical analysis.

Given an image of an athlete, this module:
1. Runs MediaPipe Pose to extract 33 body keypoints.
2. Computes clinically-relevant joint angles (knee, hip, elbow, trunk lean).
3. Computes left/right asymmetry, a widely used proxy for injury risk in
   sports-science literature (large asymmetry correlates with elevated
   non-contact injury risk).
4. Draws the skeleton on the image for visual review.
5. Applies simple threshold-based heuristic flags. These are NOT a medical
   diagnosis — they are a starting point for Milestone 3's proper risk model.
"""

import math
import os
import uuid
from typing import Optional

import cv2
import mediapipe as mp
import numpy as np

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

# Threshold, in degrees, above which a left/right joint-angle difference is
# flagged. This is a simple placeholder heuristic for Milestone 2 — Milestone 3
# will replace this with a trained model.
ASYMMETRY_THRESHOLD_DEGREES = 12.0

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _angle_between(a, b, c) -> float:
    """Angle at point b, formed by rays b->a and b->c, in degrees (0-180)."""
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)

    ba = a - b
    bc = c - b

    denom = np.linalg.norm(ba) * np.linalg.norm(bc)
    if denom == 0:
        return 0.0

    cosine = np.dot(ba, bc) / denom
    cosine = np.clip(cosine, -1.0, 1.0)
    return float(np.degrees(np.arccos(cosine)))


def _xy(landmarks, idx, image_w, image_h):
    lm = landmarks[idx]
    return (lm.x * image_w, lm.y * image_h)


def analyze_image(image_bytes: bytes, original_filename: str) -> Optional[dict]:
    """
    Runs pose estimation on raw image bytes.

    Returns a dict with joint_angles, asymmetry, risk_flags,
    landmark_confidence, and annotated_image_path (relative, for static
    serving) — or None if no person could be detected.
    """
    np_arr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Could not decode image. Please upload a valid JPG/PNG file.")

    image_h, image_w = image.shape[:2]
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    with mp_pose.Pose(static_image_mode=True, model_complexity=1, min_detection_confidence=0.5) as pose:
        results = pose.process(image_rgb)

    if not results.pose_landmarks:
        return None

    landmarks = results.pose_landmarks.landmark
    PL = mp_pose.PoseLandmark

    def pt(landmark_enum):
        return _xy(landmarks, landmark_enum.value, image_w, image_h)

    # --- Joint angles ---
    left_elbow = _angle_between(pt(PL.LEFT_SHOULDER), pt(PL.LEFT_ELBOW), pt(PL.LEFT_WRIST))
    right_elbow = _angle_between(pt(PL.RIGHT_SHOULDER), pt(PL.RIGHT_ELBOW), pt(PL.RIGHT_WRIST))

    left_knee = _angle_between(pt(PL.LEFT_HIP), pt(PL.LEFT_KNEE), pt(PL.LEFT_ANKLE))
    right_knee = _angle_between(pt(PL.RIGHT_HIP), pt(PL.RIGHT_KNEE), pt(PL.RIGHT_ANKLE))

    left_hip = _angle_between(pt(PL.LEFT_SHOULDER), pt(PL.LEFT_HIP), pt(PL.LEFT_KNEE))
    right_hip = _angle_between(pt(PL.RIGHT_SHOULDER), pt(PL.RIGHT_HIP), pt(PL.RIGHT_KNEE))

    # Trunk lean: angle of the shoulder-hip midline versus true vertical
    shoulder_mid = np.mean([pt(PL.LEFT_SHOULDER), pt(PL.RIGHT_SHOULDER)], axis=0)
    hip_mid = np.mean([pt(PL.LEFT_HIP), pt(PL.RIGHT_HIP)], axis=0)
    vertical_ref = (hip_mid[0], hip_mid[1] - 100)  # point straight above the hip midpoint
    trunk_lean = _angle_between(shoulder_mid, hip_mid, vertical_ref)

    # Shoulder / hip height difference, normalized to torso length so it is
    # comparable across different image sizes / distances from the camera.
    torso_length = float(np.linalg.norm(np.array(shoulder_mid) - np.array(hip_mid))) or 1.0
    shoulder_height_diff_pct = abs(pt(PL.LEFT_SHOULDER)[1] - pt(PL.RIGHT_SHOULDER)[1]) / torso_length * 100
    hip_height_diff_pct = abs(pt(PL.LEFT_HIP)[1] - pt(PL.RIGHT_HIP)[1]) / torso_length * 100

    joint_angles = {
        "left_elbow": round(left_elbow, 1),
        "right_elbow": round(right_elbow, 1),
        "left_knee": round(left_knee, 1),
        "right_knee": round(right_knee, 1),
        "left_hip": round(left_hip, 1),
        "right_hip": round(right_hip, 1),
        "trunk_lean_from_vertical": round(trunk_lean, 1),
    }

    asymmetry = {
        "knee_angle_diff": round(abs(left_knee - right_knee), 1),
        "hip_angle_diff": round(abs(left_hip - right_hip), 1),
        "elbow_angle_diff": round(abs(left_elbow - right_elbow), 1),
        "shoulder_height_diff_pct": round(shoulder_height_diff_pct, 1),
        "hip_height_diff_pct": round(hip_height_diff_pct, 1),
    }

    risk_flags = []
    if asymmetry["knee_angle_diff"] > ASYMMETRY_THRESHOLD_DEGREES:
        risk_flags.append(
            f"Knee angle asymmetry of {asymmetry['knee_angle_diff']}\u00b0 exceeds the {ASYMMETRY_THRESHOLD_DEGREES}\u00b0 threshold"
        )
    if asymmetry["hip_angle_diff"] > ASYMMETRY_THRESHOLD_DEGREES:
        risk_flags.append(
            f"Hip angle asymmetry of {asymmetry['hip_angle_diff']}\u00b0 exceeds the {ASYMMETRY_THRESHOLD_DEGREES}\u00b0 threshold"
        )
    if shoulder_height_diff_pct > 8:
        risk_flags.append("Notable shoulder height imbalance detected")
    if hip_height_diff_pct > 8:
        risk_flags.append("Notable hip height imbalance (pelvic obliquity) detected")
    if not risk_flags:
        risk_flags.append("No asymmetry flags triggered by current thresholds")

    avg_confidence = float(
        np.mean([lm.visibility for lm in landmarks if lm.visibility is not None])
    )

    # --- Draw annotated skeleton and save it ---
    annotated = image.copy()
    mp_drawing.draw_landmarks(
        annotated,
        results.pose_landmarks,
        mp_pose.POSE_CONNECTIONS,
        landmark_drawing_spec=mp_drawing_styles.get_default_pose_landmarks_style(),
    )

    ext = os.path.splitext(original_filename)[1].lower() or ".jpg"
    if ext not in (".jpg", ".jpeg", ".png"):
        ext = ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    cv2.imwrite(filepath, annotated)

    return {
        "joint_angles": joint_angles,
        "asymmetry": asymmetry,
        "risk_flags": risk_flags,
        "landmark_confidence": round(avg_confidence, 3),
        "annotated_image_filename": filename,
    }
