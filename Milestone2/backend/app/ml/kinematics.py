import math
import numpy as np

# Landmark mapping constants
LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12
LEFT_HIP = 23
RIGHT_HIP = 24
LEFT_KNEE = 25
RIGHT_KNEE = 26
LEFT_ANKLE = 27
RIGHT_ANKLE = 28

def calculate_3d_angle(a: tuple, b: tuple, c: tuple) -> float:
    """
    Calculates the 3D angle (in degrees) at vertex point b between vectors (ba) and (bc).
    a, b, c are (x, y, z) tuples or lists.
    """
    ba = np.array([a[0] - b[0], a[1] - b[1], a[2] - b[2]])
    bc = np.array([c[0] - b[0], c[1] - b[1], c[2] - b[2]])

    norm_ba = np.linalg.norm(ba)
    norm_bc = np.linalg.norm(bc)

    if norm_ba == 0 or norm_bc == 0:
        return 0.0

    cosine_angle = np.dot(ba, bc) / (norm_ba * norm_bc)
    cosine_angle = np.clip(cosine_angle, -1.0, 1.0)
    angle = np.arccos(cosine_angle)
    return round(float(np.degrees(angle)), 2)

def calculate_frontal_valgus_angle(hip: tuple, knee: tuple, ankle: tuple) -> float:
    """
    Calculates 2D frontal plane Knee Valgus (inward collapse) angle in degrees.
    0° = Perfectly straight vertical joint alignment.
    Higher values (>10-15°) indicate inward valgus collapse.
    """
    # Frontal plane (x, y) coordinates
    v_hk = np.array([knee[0] - hip[0], knee[1] - hip[1]])
    v_ka = np.array([ankle[0] - knee[0], ankle[1] - knee[1]])

    norm_hk = np.linalg.norm(v_hk)
    norm_ka = np.linalg.norm(v_ka)

    if norm_hk == 0 or norm_ka == 0:
        return 0.0

    dot = np.dot(v_hk, v_ka) / (norm_hk * norm_ka)
    dot = np.clip(dot, -1.0, 1.0)
    dev_angle = np.degrees(np.arccos(dot))
    
    # Check direction of inward collapse
    # For left leg (hip.x < ankle.x), inward collapse is knee moving right (+x)
    # For right leg (hip.x > ankle.x), inward collapse is knee moving left (-x)
    valgus_angle = dev_angle
    return round(float(valgus_angle), 2)

def calculate_trunk_lean(l_shoulder: tuple, r_shoulder: tuple, l_hip: tuple, r_hip: tuple) -> dict:
    """
    Calculates torso inclination (Trunk Lean) angles relative to vertical:
    - frontal_lean: Side tilt (left/right leaning)
    - sagittal_lean: Forward/backward trunk lean angle
    - hip_tilt: Lateral pelvis tilt angle
    """
    s_mid = np.array([(l_shoulder[0] + r_shoulder[0])/2.0, (l_shoulder[1] + r_shoulder[1])/2.0, (l_shoulder[2] + r_shoulder[2])/2.0])
    h_mid = np.array([(l_hip[0] + r_hip[0])/2.0, (l_hip[1] + r_hip[1])/2.0, (l_hip[2] + r_hip[2])/2.0])

    trunk_vec = s_mid - h_mid
    # Vertical vector pointing upwards in image coords (-y direction)
    vert_vec = np.array([0.0, -1.0, 0.0])

    norm_trunk = np.linalg.norm(trunk_vec)
    if norm_trunk == 0:
        return {"frontal_lean": 0.0, "sagittal_lean": 0.0, "hip_tilt": 0.0}

    # Sagittal lean angle (angle between trunk vector and vertical)
    dot_sag = np.dot(trunk_vec[:2], vert_vec[:2]) / np.linalg.norm(trunk_vec[:2])
    dot_sag = np.clip(dot_sag, -1.0, 1.0)
    sagittal_lean = np.degrees(np.arccos(dot_sag))

    # Frontal lean (side tilt)
    dx = trunk_vec[0]
    dy = trunk_vec[1]
    frontal_lean = np.degrees(np.arctan2(abs(dx), abs(dy)))

    # Hip tilt angle (pelvic lateral drop)
    dh_x = r_hip[0] - l_hip[0]
    dh_y = r_hip[1] - l_hip[1]
    hip_tilt = np.degrees(np.arctan2(abs(dh_y), abs(dh_x)))

    return {
        "frontal_lean": round(float(frontal_lean), 2),
        "sagittal_lean": round(float(sagittal_lean), 2),
        "hip_tilt": round(float(hip_tilt), 2)
    }

def calculate_asymmetry_index(left_val: float, right_val: float) -> float:
    """
    Computes Movement Symmetry Index (%):
    Asymmetry Index (%) = | left - right | / max(left, right) * 100
    """
    max_val = max(abs(left_val), abs(right_val))
    if max_val == 0:
        return 0.0
    asymmetry = (abs(left_val - right_val) / max_val) * 100.0
    return round(float(asymmetry), 2)

class BiomechanicalKinematicsEngine:
    def __init__(self):
        pass

    def analyze_movement_log(self, movement_log: dict) -> dict:
        """
        Analyzes keypoint movement log frame-by-frame.
        Extracts joint angles time series and summary metrics:
        - Knee Valgus (Left & Right)
        - Knee Flexion (Left & Right)
        - Hip Stability & Trunk Lean
        - Movement Symmetry Index %
        - Landing Mechanics (Peak flexion, Impact Phase Duration)
        """
        frames = movement_log.get("frames", [])
        fps = movement_log.get("fps", 30.0)
        total_frames = len(frames)

        time_series = []
        
        left_valgus_series = []
        right_valgus_series = []
        left_flexion_series = []
        right_flexion_series = []
        sagittal_lean_series = []
        frontal_lean_series = []
        hip_tilt_series = []

        for frame in frames:
            f_idx = frame["frame_index"]
            timestamp = frame["timestamp_sec"]
            lms_list = frame["landmarks"]

            # Map landmark array to dictionary by ID
            lm_dict = {lm["id"]: (lm["x"], lm["y"], lm["z"]) for lm in lms_list}

            # Retrieve core joints
            l_sh = lm_dict.get(LEFT_SHOULDER, (0.42, 0.28, 0.0))
            r_sh = lm_dict.get(RIGHT_SHOULDER, (0.58, 0.28, 0.0))
            l_hip = lm_dict.get(LEFT_HIP, (0.45, 0.50, 0.0))
            r_hip = lm_dict.get(RIGHT_HIP, (0.55, 0.50, 0.0))
            l_knee = lm_dict.get(LEFT_KNEE, (0.43, 0.68, 0.0))
            r_knee = lm_dict.get(RIGHT_KNEE, (0.57, 0.68, 0.0))
            l_ank = lm_dict.get(LEFT_ANKLE, (0.43, 0.85, 0.0))
            r_ank = lm_dict.get(RIGHT_ANKLE, (0.57, 0.85, 0.0))

            # 1. Knee Flexion Angles (3D Hip-Knee-Ankle)
            l_flexion = calculate_3d_angle(l_hip, l_knee, l_ank)
            r_flexion = calculate_3d_angle(r_hip, r_knee, r_ank)

            # 2. Knee Valgus Angles
            l_valgus = calculate_frontal_valgus_angle(l_hip, l_knee, l_ank)
            r_valgus = calculate_frontal_valgus_angle(r_hip, r_knee, r_ank)

            # 3. Trunk Lean & Pelvic Tilt
            trunk_metrics = calculate_trunk_lean(l_sh, r_sh, l_hip, r_hip)

            left_valgus_series.append(l_valgus)
            right_valgus_series.append(r_valgus)
            left_flexion_series.append(l_flexion)
            right_flexion_series.append(r_flexion)
            sagittal_lean_series.append(trunk_metrics["sagittal_lean"])
            frontal_lean_series.append(trunk_metrics["frontal_lean"])
            hip_tilt_series.append(trunk_metrics["hip_tilt"])

            time_series.append({
                "frame": f_idx,
                "timestamp_sec": timestamp,
                "left_knee_flexion": l_flexion,
                "right_knee_flexion": r_flexion,
                "left_knee_valgus": l_valgus,
                "right_knee_valgus": r_valgus,
                "sagittal_trunk_lean": trunk_metrics["sagittal_lean"],
                "frontal_trunk_lean": trunk_metrics["frontal_lean"],
                "hip_tilt": trunk_metrics["hip_tilt"]
            })

        # Summary Peak Indicators
        peak_left_valgus = max(left_valgus_series) if left_valgus_series else 0.0
        peak_right_valgus = max(right_valgus_series) if right_valgus_series else 0.0
        max_knee_valgus = max(peak_left_valgus, peak_right_valgus)

        min_left_flexion = min(left_flexion_series) if left_flexion_series else 180.0
        min_right_flexion = min(right_flexion_series) if right_flexion_series else 180.0
        peak_flexion_depth = min(min_left_flexion, min_right_flexion) # lowest angle = maximum knee bend

        peak_sagittal_lean = max(sagittal_lean_series) if sagittal_lean_series else 0.0
        peak_hip_tilt = max(hip_tilt_series) if hip_tilt_series else 0.0

        # Landing Impact Phase Duration (frames where knee flexion is within deep bend phase)
        impact_threshold = peak_flexion_depth + 15.0 # frames with knee angle <= peak + 15 deg
        impact_frames = [f for f in time_series if min(f["left_knee_flexion"], f["right_knee_flexion"]) <= impact_threshold]
        impact_duration_ms = round((len(impact_frames) / fps) * 1000.0, 1)

        # Movement Symmetry Index %
        valgus_asymmetry = calculate_asymmetry_index(peak_left_valgus, peak_right_valgus)
        flexion_asymmetry = calculate_asymmetry_index(min_left_flexion, min_right_flexion)
        overall_asymmetry = round((valgus_asymmetry + flexion_asymmetry) / 2.0, 2)

        # Risk Classification & Alert Badges
        # Green = Normal, Yellow = Warning, Red = Deviation
        risk_level = "NORMAL"
        valgus_badge = "GREEN"
        symmetry_badge = "GREEN"
        trunk_badge = "GREEN"

        if max_knee_valgus > 18.0 or overall_asymmetry > 20.0 or peak_sagittal_lean > 35.0:
            risk_level = "HIGH_RISK"
        elif max_knee_valgus > 10.0 or overall_asymmetry > 10.0 or peak_sagittal_lean > 20.0:
            risk_level = "MODERATE_RISK"

        if max_knee_valgus > 18.0:
            valgus_badge = "RED"
        elif max_knee_valgus > 10.0:
            valgus_badge = "YELLOW"

        if overall_asymmetry > 20.0:
            symmetry_badge = "RED"
        elif overall_asymmetry > 10.0:
            symmetry_badge = "YELLOW"

        if peak_sagittal_lean > 35.0:
            trunk_badge = "RED"
        elif peak_sagittal_lean > 20.0:
            trunk_badge = "YELLOW"

        # Risk Badges Summary List
        risk_alerts = []
        if valgus_badge != "GREEN":
            risk_alerts.append({
                "metric": "Knee Valgus",
                "severity": valgus_badge,
                "message": f"Peak knee valgus of {max_knee_valgus:.1f}° detected. Risk of ACL strain during landing/cutting."
            })
        if symmetry_badge != "GREEN":
            risk_alerts.append({
                "metric": "Movement Symmetry",
                "severity": symmetry_badge,
                "message": f"L/R movement asymmetry of {overall_asymmetry:.1f}% exceeds normal bilateral threshold (<10%)."
            })
        if trunk_badge != "GREEN":
            risk_alerts.append({
                "metric": "Trunk Inclination",
                "severity": trunk_badge,
                "message": f"Forward trunk lean of {peak_sagittal_lean:.1f}° observed during dynamic movement phase."
            })

        if not risk_alerts:
            risk_alerts.append({
                "metric": "Biomechanics Alignment",
                "severity": "GREEN",
                "message": "Optimal joint alignment, bilateral symmetry, and landing mechanics observed."
            })

        return {
            "video_id": movement_log.get("video_id"),
            "movement_type": movement_log.get("movement_type", "General"),
            "total_frames": total_frames,
            "fps": fps,
            "summary_metrics": {
                "peak_knee_valgus_left": float(peak_left_valgus),
                "peak_knee_valgus_right": float(peak_right_valgus),
                "max_knee_valgus": float(max_knee_valgus),
                "peak_knee_flexion_left": float(min_left_flexion),
                "peak_knee_flexion_right": float(min_right_flexion),
                "peak_flexion_depth": float(peak_flexion_depth),
                "impact_phase_duration_ms": float(impact_duration_ms),
                "valgus_asymmetry_pct": float(valgus_asymmetry),
                "flexion_asymmetry_pct": float(flexion_asymmetry),
                "overall_asymmetry_pct": float(overall_asymmetry),
                "peak_sagittal_trunk_lean": float(peak_sagittal_lean),
                "peak_hip_tilt": float(peak_hip_tilt),
                "risk_level": str(risk_level)
            },
            "risk_badges": {
                "knee_valgus": valgus_badge,
                "symmetry": symmetry_badge,
                "trunk_lean": trunk_badge
            },
            "risk_alerts": risk_alerts,
            "time_series": time_series
        }
