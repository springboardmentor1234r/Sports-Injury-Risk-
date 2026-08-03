"""
Milestone 2 — Biomechanical Analysis Engine
Location: backend/services/biomechanics.py

Covers PDF section "5. Biomechanical Analysis Engine" for the metrics that
are computable from a single 2D camera feed:
  - Joint angle analysis
  - Range of motion (ROM) analysis
  - Movement symmetry evaluation
  - Posture assessment (trunk lean)
  - Knee Valgus (proxy metric — see note below)

IMPORTANT ACCURACY NOTE (tell your mentor/reviewer this too):
MediaPipe gives 2D pixel-normalized coordinates (+ a rough relative z).
True knee valgus and force estimation clinically require multiple
calibrated camera angles or 3D motion capture. The functions below give
useful *relative* / *trend* metrics from a single video (e.g. "this
athlete's valgus deviation is increasing week over week" or "left vs
right asymmetry is 18%") — good enough for a risk-screening tool, but
they are proxies, not clinical-grade biomechanics. Document this
assumption in your final report/presentation.
"""

from typing import Dict, List, Optional

import numpy as np


def calculate_angle(a: dict, b: dict, c: dict) -> float:
    """Angle at vertex b, formed by points a-b-c, in degrees (2D)."""
    a_xy = np.array([a["x"], a["y"]])
    b_xy = np.array([b["x"], b["y"]])
    c_xy = np.array([c["x"], c["y"]])

    ba = a_xy - b_xy
    bc = c_xy - b_xy

    denom = (np.linalg.norm(ba) * np.linalg.norm(bc)) + 1e-8
    cosine_angle = np.clip(np.dot(ba, bc) / denom, -1.0, 1.0)
    return round(float(np.degrees(np.arccos(cosine_angle))), 2)


def compute_joint_angles(keypoints: Dict[str, dict]) -> Dict[str, float]:
    """Computes the core joint angles the PDF's scoring model needs."""
    angles = {}
    try:
        angles["left_knee"] = calculate_angle(
            keypoints["left_hip"], keypoints["left_knee"], keypoints["left_ankle"]
        )
        angles["right_knee"] = calculate_angle(
            keypoints["right_hip"], keypoints["right_knee"], keypoints["right_ankle"]
        )
        angles["left_hip"] = calculate_angle(
            keypoints["left_shoulder"], keypoints["left_hip"], keypoints["left_knee"]
        )
        angles["right_hip"] = calculate_angle(
            keypoints["right_shoulder"], keypoints["right_hip"], keypoints["right_knee"]
        )
        angles["left_elbow"] = calculate_angle(
            keypoints["left_shoulder"], keypoints["left_elbow"], keypoints["left_wrist"]
        )
        angles["right_elbow"] = calculate_angle(
            keypoints["right_shoulder"], keypoints["right_elbow"], keypoints["right_wrist"]
        )
    except KeyError:
        # A joint wasn't visible/detected in this frame — skip silently,
        # the aggregate report just uses whatever frames succeeded.
        pass
    return angles


def knee_valgus_proxy(keypoints: Dict[str, dict], side: str = "left") -> float:
    """
    Proxy for knee valgus: how far the knee deviates sideways from the
    straight line between hip and ankle. Positive/negative sign depends on
    camera orientation — what matters for risk screening is the magnitude
    and the trend over time, not the raw sign.
    """
    hip = keypoints[f"{side}_hip"]
    knee = keypoints[f"{side}_knee"]
    ankle = keypoints[f"{side}_ankle"]

    expected_knee_x = hip["x"] + (ankle["x"] - hip["x"]) * 0.5
    deviation = knee["x"] - expected_knee_x
    return round(float(deviation), 4)


def trunk_lean(keypoints: Dict[str, dict]) -> float:
    """Trunk angle from vertical (degrees), using shoulder/hip midpoints."""
    mid_shoulder = {
        "x": (keypoints["left_shoulder"]["x"] + keypoints["right_shoulder"]["x"]) / 2,
        "y": (keypoints["left_shoulder"]["y"] + keypoints["right_shoulder"]["y"]) / 2,
    }
    mid_hip = {
        "x": (keypoints["left_hip"]["x"] + keypoints["right_hip"]["x"]) / 2,
        "y": (keypoints["left_hip"]["y"] + keypoints["right_hip"]["y"]) / 2,
    }
    dx = mid_shoulder["x"] - mid_hip["x"]
    dy = mid_shoulder["y"] - mid_hip["y"]
    angle_from_vertical = np.degrees(np.arctan2(abs(dx), abs(dy) + 1e-8))
    return round(float(angle_from_vertical), 2)


def movement_symmetry(angles_left: List[float], angles_right: List[float]) -> Optional[float]:
    """0-100 symmetry score comparing paired left/right angle sequences."""
    if not angles_left or not angles_right:
        return None
    n = min(len(angles_left), len(angles_right))
    diffs = [abs(angles_left[i] - angles_right[i]) for i in range(n)]
    avg_diff = float(np.mean(diffs))
    return round(max(0.0, 100.0 - avg_diff), 2)


def generate_biomechanics_report(pose_frames: List[dict]) -> dict:
    """
    pose_frames: list of {"keypoints": {...}, "joint_angles": {...}}
    (joint_angles is optional — computed on the fly if missing)

    Returns a dict matching the BiomechanicsReport model fields.
    """
    knee_valgus_left, knee_valgus_right = [], []
    trunk_leans = []
    left_knee_angles, right_knee_angles = [], []

    for frame in pose_frames:
        kp = frame["keypoints"]
        try:
            knee_valgus_left.append(knee_valgus_proxy(kp, "left"))
            knee_valgus_right.append(knee_valgus_proxy(kp, "right"))
            trunk_leans.append(trunk_lean(kp))

            angles = frame.get("joint_angles") or compute_joint_angles(kp)
            if "left_knee" in angles:
                left_knee_angles.append(angles["left_knee"])
            if "right_knee" in angles:
                right_knee_angles.append(angles["right_knee"])
        except (KeyError, ZeroDivisionError):
            continue

    def safe_mean(lst):
        return round(float(np.mean(lst)), 2) if lst else None

    avg_valgus_left = safe_mean(knee_valgus_left)
    avg_valgus_right = safe_mean(knee_valgus_right)
    valgus_asymmetry = (
        round(abs(avg_valgus_left - avg_valgus_right), 4)
        if avg_valgus_left is not None and avg_valgus_right is not None
        else None
    )

    symmetry_score = movement_symmetry(left_knee_angles, right_knee_angles)

    rom_summary = {
        "left_knee": (
            {"min": min(left_knee_angles), "max": max(left_knee_angles)}
            if left_knee_angles
            else None
        ),
        "right_knee": (
            {"min": min(right_knee_angles), "max": max(right_knee_angles)}
            if right_knee_angles
            else None
        ),
    }

    # Simple 0-100 movement quality score. This is a *starter* heuristic —
    # Milestone 3 (Injury Risk Prediction Engine + the PDF's weighted
    # scoring model: 35% biomechanical deviations, 20% history, 20%
    # asymmetry, 15% training load, 10% fatigue) replaces this with the
    # full weighted model once training-load and injury-history data
    # feed in from the Athlete Profile module you built in Milestone 1.
    quality_components = []
    if valgus_asymmetry is not None:
        quality_components.append(max(0.0, 100.0 - valgus_asymmetry * 500))
    if symmetry_score is not None:
        quality_components.append(symmetry_score)
    movement_quality_score = safe_mean(quality_components)

    return {
        "avg_knee_valgus_left": avg_valgus_left,
        "avg_knee_valgus_right": avg_valgus_right,
        "knee_valgus_asymmetry": valgus_asymmetry,
        "avg_trunk_lean": safe_mean(trunk_leans),
        "movement_symmetry_score": symmetry_score,
        "rom_summary": rom_summary,
        "movement_quality_score": movement_quality_score,
    }
