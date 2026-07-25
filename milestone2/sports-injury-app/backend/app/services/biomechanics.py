"""
services/biomechanics.py
--------------------------
Turns a raw 33-point MediaPipe landmark set into the joint angles the BRD's
Biomechanical Analysis Engine module calls for (joint angle analysis, range
of motion, movement symmetry), plus a per-video summary aggregation.

Angle convention: calculate_angle(a, b, c) returns the interior angle at
vertex b, in degrees, formed by the rays b->a and b->c. For a knee angle,
that means a=hip, b=knee, c=ankle: a fully straight leg reads ~180 degrees,
a deeply bent knee reads a small angle. This matches how sports-science
literature typically reports joint angles (extension = larger angle), which
is worth knowing if you compare these numbers against other tools.
"""

import math
from app.services.pose_estimation import LANDMARK_NAMES

# Map MediaPipe's landmark names (from LANDMARK_NAMES) to a lookup index,
# so we can pull out named points like "left_hip" from the raw list.
_NAME_TO_INDEX = {name: i for i, name in enumerate(LANDMARK_NAMES)}

# Below this confidence, we don't trust the point enough to compute an angle
# from it -- an occluded joint produces noisy coordinates, not a meaningful angle.
VISIBILITY_THRESHOLD = 0.5


def _point(landmarks: list[dict], name: str):
    idx = _NAME_TO_INDEX.get(name)
    if idx is None or idx >= len(landmarks):
        return None
    lm = landmarks[idx]
    if lm["visibility"] < VISIBILITY_THRESHOLD:
        return None
    return (lm["x"], lm["y"])


def calculate_angle(a, b, c) -> float:
    """Interior angle at vertex b (degrees), formed by points a-b-c."""
    bax = a[0] - b[0]
    bay = a[1] - b[1]
    bcx = c[0] - b[0]
    bcy = c[1] - b[1]

    dot = bax * bcx + bay * bcy
    mag_ba = math.hypot(bax, bay)
    mag_bc = math.hypot(bcx, bcy)
    if mag_ba == 0 or mag_bc == 0:
        return None

    cos_angle = max(-1.0, min(1.0, dot / (mag_ba * mag_bc)))
    return round(math.degrees(math.acos(cos_angle)), 2)


def compute_frame_angles(landmarks: list[dict]) -> dict:
    """
    Given one frame's 33 landmarks, compute the joint angles we track.
    Any angle whose input points aren't confidently visible comes back as
    None rather than a fabricated number -- a missing value is more honest
    than a wrong one.
    """
    angles = {
        "left_knee_angle": None,
        "right_knee_angle": None,
        "left_hip_angle": None,
        "right_hip_angle": None,
        "left_elbow_angle": None,
        "right_elbow_angle": None,
        "trunk_lean_angle": None,
    }
    if not landmarks:
        return angles

    def angle_if_visible(name_a, name_b, name_c):
        a, b, c = _point(landmarks, name_a), _point(landmarks, name_b), _point(landmarks, name_c)
        if a is None or b is None or c is None:
            return None
        return calculate_angle(a, b, c)

    angles["left_knee_angle"] = angle_if_visible("left_hip", "left_knee", "left_ankle")
    angles["right_knee_angle"] = angle_if_visible("right_hip", "right_knee", "right_ankle")
    angles["left_hip_angle"] = angle_if_visible("left_shoulder", "left_hip", "left_knee")
    angles["right_hip_angle"] = angle_if_visible("right_shoulder", "right_hip", "right_knee")
    angles["left_elbow_angle"] = angle_if_visible("left_shoulder", "left_elbow", "left_wrist")
    angles["right_elbow_angle"] = angle_if_visible("right_shoulder", "right_elbow", "right_wrist")

    # Trunk lean: angle between the shoulder-to-hip line and true vertical.
    # 0 degrees = perfectly upright torso; larger = more forward/lateral lean.
    l_shoulder, r_shoulder = _point(landmarks, "left_shoulder"), _point(landmarks, "right_shoulder")
    l_hip, r_hip = _point(landmarks, "left_hip"), _point(landmarks, "right_hip")
    if l_shoulder and r_shoulder and l_hip and r_hip:
        mid_shoulder = ((l_shoulder[0] + r_shoulder[0]) / 2, (l_shoulder[1] + r_shoulder[1]) / 2)
        mid_hip = ((l_hip[0] + r_hip[0]) / 2, (l_hip[1] + r_hip[1]) / 2)
        dx = mid_shoulder[0] - mid_hip[0]
        dy = mid_shoulder[1] - mid_hip[1]
        # atan2 against the "up" direction (negative y, since image y grows downward)
        angle_from_vertical = math.degrees(math.atan2(abs(dx), abs(dy)))
        angles["trunk_lean_angle"] = round(angle_from_vertical, 2)

    return angles


def summarize_video(frame_angle_rows: list[dict]) -> dict:
    """
    Aggregates a list of per-frame angle dicts (as stored in VideoFrame rows)
    into a single summary: min/max/avg range of motion per joint, plus a
    left-right symmetry score for the knee (the metric most directly relevant
    to the BRD's "Movement Symmetry Evaluation" requirement).

    Returns a dict of {metric_name: {min, max, avg, unit}} plus a top-level
    "knee_symmetry_score" (0 = perfectly symmetric, larger = more asymmetric).
    """
    metrics = ["left_knee_angle", "right_knee_angle", "left_hip_angle", "right_hip_angle",
               "left_elbow_angle", "right_elbow_angle", "trunk_lean_angle"]

    summary = {}
    for metric in metrics:
        values = [row[metric] for row in frame_angle_rows if row.get(metric) is not None]
        if not values:
            summary[metric] = None
            continue
        summary[metric] = {
            "min": round(min(values), 2),
            "max": round(max(values), 2),
            "avg": round(sum(values) / len(values), 2),
            "range_of_motion": round(max(values) - min(values), 2),
            "unit": "degrees",
            "sample_count": len(values),
        }

    left_rom = summary.get("left_knee_angle")
    right_rom = summary.get("right_knee_angle")
    knee_symmetry_score = None
    if left_rom and right_rom:
        # Symmetry score: how differently the two knees moved through their
        # range of motion. 0 = identical ROM on both sides.
        knee_symmetry_score = round(abs(left_rom["range_of_motion"] - right_rom["range_of_motion"]), 2)

    return {
        "joint_angles": summary,
        "knee_symmetry_score": knee_symmetry_score,
    }
