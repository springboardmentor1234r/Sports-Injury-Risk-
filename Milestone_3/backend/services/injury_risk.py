"""
Milestone 3 — Injury Risk Prediction Engine, Movement Anomaly Detection
Engine, Risk Scoring Engine, Corrective Recommendation Engine
Location: backend/services/injury_risk.py

Covers PDF sections:
  6. Injury Risk Prediction Engine
  7. Movement Anomaly Detection Engine
  8. Risk Scoring Engine (Weighted Scoring Model + Risk Categories)
  9. Corrective Recommendation Engine

IMPORTANT ACCURACY NOTE (same spirit as services/biomechanics.py):
This is a rule-based / heuristic screening model built on top of the
single-camera 2D biomechanics proxies from Milestone 2, plus whatever
free-text injury_history / training_load the athlete entered in their
profile (Milestone 1). It is designed to be directionally useful for
risk-screening and to demonstrate the full pipeline the PDF describes —
it is NOT a clinically validated injury-prediction model. A production
version would replace the hand-tuned weights/heuristics below with a
model trained on the recommended datasets (Section 5 Milestone1: Human3.6M,
MPII, COCO, SportsPose, FIFA Injury Dataset).
"""

import re
from typing import Dict, List, Optional, Any

import numpy as np

from services.biomechanics import knee_valgus_proxy, trunk_lean

# ---------------------------------------------------------------------------
# Weighted Scoring Model (PDF section 8 "Weighted Scoring Model")
# Injury Risk Score = Biomechanical Deviations (35%) + Historical Injury
# Factors (20%) + Movement Asymmetry (20%) + Training Load Indicators (15%)
# + Fatigue Indicators (10%)
# ---------------------------------------------------------------------------
WEIGHTS = {
    "biomechanical_deviation": 0.35,
    "historical_injury": 0.20,
    "movement_asymmetry": 0.20,
    "training_load": 0.15,
    "fatigue": 0.10,
}

HIGH_IMPACT_ACTIVITIES = {"landing", "jumping", "cutting_movement", "sprinting", "sport_specific_drill"}


# ---------------------------------------------------------------------------
# 7. Movement Anomaly Detection Engine
# ---------------------------------------------------------------------------

def _per_frame_metrics(pose_frames: List[dict]) -> List[dict]:
    """Re-derives per-frame valgus/trunk-lean/knee-angle metrics straight
    from keypoints so this engine doesn't depend on frames already having
    joint_angles computed."""
    metrics = []
    for f in pose_frames:
        kp = f.get("keypoints") or {}
        angles = f.get("joint_angles") or {}
        try:
            valgus_l = knee_valgus_proxy(kp, "left")
            valgus_r = knee_valgus_proxy(kp, "right")
            lean = trunk_lean(kp)
        except (KeyError, ZeroDivisionError):
            continue
        metrics.append(
            {
                "valgus_avg": (abs(valgus_l) + abs(valgus_r)) / 2,
                "trunk_lean": lean,
                "left_knee_angle": angles.get("left_knee"),
                "right_knee_angle": angles.get("right_knee"),
            }
        )
    return metrics


def detect_movement_anomalies(pose_frames: List[dict]) -> dict:
    """
    Covers PDF section 7:
      - Movement deviation detection (frame-level outliers vs the clip's
        own baseline)
      - Motion inconsistency analysis (frame-to-frame variance)
      - Fatigue-related movement monitoring (first-half vs second-half
        degradation)
      - Performance decline detection (shrinking range of motion)
    """
    metrics = _per_frame_metrics(pose_frames)

    if len(metrics) < 4:
        return {
            "anomalies": [
                {
                    "type": "insufficient_data",
                    "severity": "info",
                    "description": "Not enough tracked frames for full anomaly/fatigue analysis.",
                }
            ],
            "fatigue_detected": False,
            "fatigue_detail": {},
            "performance_decline": False,
        }

    anomalies: List[dict] = []
    valgus_series = np.array([m["valgus_avg"] for m in metrics])
    trunk_series = np.array([m["trunk_lean"] for m in metrics])

    def _outlier_count(series: np.ndarray) -> int:
        mean, std = float(np.mean(series)), float(np.std(series))
        if std < 1e-6:
            return 0
        z = np.abs((series - mean) / std)
        return int(np.sum(z > 2))

    valgus_outliers = _outlier_count(valgus_series)
    trunk_outliers = _outlier_count(trunk_series)

    if valgus_outliers > 0:
        anomalies.append(
            {
                "type": "movement_deviation",
                "severity": "high" if valgus_outliers > 2 else "moderate",
                "description": f"Detected {valgus_outliers} frame(s) with sharp knee-valgus deviation from this clip's own baseline.",
            }
        )
    if trunk_outliers > 0:
        anomalies.append(
            {
                "type": "movement_deviation",
                "severity": "high" if trunk_outliers > 2 else "moderate",
                "description": f"Detected {trunk_outliers} frame(s) with sharp trunk-posture deviation from baseline.",
            }
        )

    # Motion inconsistency: coefficient of variation on knee-valgus signal
    valgus_mean = float(np.mean(valgus_series))
    valgus_cv = float(np.std(valgus_series) / (valgus_mean + 1e-6))
    if valgus_cv > 0.6:
        anomalies.append(
            {
                "type": "motion_inconsistency",
                "severity": "moderate",
                "description": "Knee alignment is inconsistent frame-to-frame — technique isn't repeating cleanly.",
            }
        )

    # Fatigue-related movement monitoring: first half vs second half of clip
    mid = len(metrics) // 2
    first_half_valgus = float(np.mean(valgus_series[:mid]))
    second_half_valgus = float(np.mean(valgus_series[mid:]))
    first_half_trunk = float(np.mean(trunk_series[:mid]))
    second_half_trunk = float(np.mean(trunk_series[mid:]))

    valgus_increase_pct = 0.0
    if abs(first_half_valgus) > 1e-6:
        valgus_increase_pct = ((second_half_valgus - first_half_valgus) / abs(first_half_valgus)) * 100

    trunk_increase_pct = 0.0
    if abs(first_half_trunk) > 1e-6:
        trunk_increase_pct = ((second_half_trunk - first_half_trunk) / abs(first_half_trunk)) * 100

    fatigue_detected = valgus_increase_pct > 25 or trunk_increase_pct > 20
    if fatigue_detected:
        anomalies.append(
            {
                "type": "fatigue",
                "severity": "high" if (valgus_increase_pct > 50 or trunk_increase_pct > 40) else "moderate",
                "description": "Form degrades in the second half of the clip (increased knee valgus / trunk lean) — a classic fatigue signature.",
            }
        )

    fatigue_detail = {
        "valgus_increase_pct": round(valgus_increase_pct, 1),
        "trunk_lean_increase_pct": round(trunk_increase_pct, 1),
    }

    # Performance decline: knee range-of-motion shrinking later in the clip
    performance_decline = False
    left_angles = [m["left_knee_angle"] for m in metrics if m["left_knee_angle"] is not None]
    if len(left_angles) >= 4:
        mid_a = len(left_angles) // 2
        first_rom = max(left_angles[:mid_a]) - min(left_angles[:mid_a])
        second_rom = max(left_angles[mid_a:]) - min(left_angles[mid_a:])
        if first_rom > 0 and (first_rom - second_rom) / first_rom > 0.25:
            performance_decline = True
            anomalies.append(
                {
                    "type": "performance_decline",
                    "severity": "moderate",
                    "description": "Knee range of motion shrinks noticeably later in the clip — may indicate fatigue or guarding.",
                }
            )

    if not anomalies:
        anomalies.append(
            {
                "type": "none",
                "severity": "info",
                "description": "No significant movement anomalies detected in this clip.",
            }
        )

    return {
        "anomalies": anomalies,
        "fatigue_detected": fatigue_detected,
        "fatigue_detail": fatigue_detail,
        "performance_decline": performance_decline,
    }


# ---------------------------------------------------------------------------
# 8. Risk Scoring Engine — per-component sub-scores (0-100, higher = riskier)
# ---------------------------------------------------------------------------

def _score_biomechanical_deviation(report: dict) -> float:
    components = []
    valgus_asym = report.get("knee_valgus_asymmetry")
    if valgus_asym is not None:
        components.append(min(100.0, valgus_asym * 800))
    trunk = report.get("avg_trunk_lean")
    if trunk is not None:
        components.append(min(100.0, max(0.0, (trunk - 5) * 4)))
    quality = report.get("movement_quality_score")
    if quality is not None:
        components.append(max(0.0, 100.0 - quality))
    if not components:
        return 50.0  # unknown -> assume moderate rather than zero
    return round(float(np.mean(components)), 2)


def _score_movement_asymmetry(report: dict) -> float:
    symmetry = report.get("movement_symmetry_score")
    if symmetry is not None:
        return round(max(0.0, 100.0 - symmetry), 2)
    valgus_asym = report.get("knee_valgus_asymmetry")
    if valgus_asym is not None:
        return round(min(100.0, valgus_asym * 800), 2)
    return 50.0


def _score_historical_injury(injury_history: Optional[str]) -> float:
    if not injury_history or injury_history.strip().lower() in {"", "none", "no", "n/a", "na"}:
        return 10.0
    return 60.0  # any documented history is a well-established risk factor


def _score_training_load(training_load: Optional[str]) -> float:
    if not training_load:
        return 40.0
    text = training_load.strip().lower()
    if any(k in text for k in ["very high", "excessive", "overload"]):
        return 90.0
    if "high" in text:
        return 75.0
    if any(k in text for k in ["moderate", "medium", "average"]):
        return 50.0
    if "low" in text or "light" in text:
        return 20.0
    match = re.search(r"(\d+(\.\d+)?)", text)
    if match:
        value = float(match.group(1))
        return round(min(100.0, value * 6), 2)  # rough scale (e.g. sessions/week)
    return 40.0


def _score_fatigue(anomaly_result: dict) -> float:
    if not anomaly_result.get("fatigue_detected"):
        return 15.0
    detail = anomaly_result.get("fatigue_detail", {})
    magnitude = max(detail.get("valgus_increase_pct", 0), detail.get("trunk_lean_increase_pct", 0))
    return round(min(100.0, 40 + magnitude), 2)


def _risk_category(score: float) -> str:
    if score < 30:
        return "Low"
    if score < 55:
        return "Moderate"
    if score < 75:
        return "High"
    return "Critical"


# ---------------------------------------------------------------------------
# 6. Injury Risk Prediction Engine — per Injury Category (PDF "Injury Categories")
# ---------------------------------------------------------------------------

def _injury_type_risks(report: dict, activity_type: str, subscores: Dict[str, float]) -> Dict[str, float]:
    trunk = report.get("avg_trunk_lean") or 0.0
    valgus_asym = report.get("knee_valgus_asymmetry") or 0.0

    biomech_risk = subscores["biomechanical_deviation"]
    asymmetry_risk = subscores["movement_asymmetry"]
    fatigue_risk = subscores["fatigue"]
    training_risk = subscores["training_load"]

    is_high_impact = activity_type in HIGH_IMPACT_ACTIVITIES

    acl = min(100.0, (valgus_asym * 900) * (1.4 if is_high_impact else 1.0) + trunk * 1.0)
    hamstring = min(
        100.0,
        (fatigue_risk * 0.5) + (asymmetry_risk * 0.4) + (25 if activity_type in {"sprinting", "running"} else 0),
    )
    ankle = min(100.0, (biomech_risk * 0.4) + (30 if activity_type in {"landing", "jumping", "cutting_movement"} else 0))
    shoulder = min(100.0, (asymmetry_risk * 0.3) + (40 if activity_type == "throwing" else 0))
    lower_back = min(100.0, trunk * 2.2 + training_risk * 0.2)
    overuse = min(100.0, training_risk * 0.6 + fatigue_risk * 0.4)

    return {
        "ACL Injury Risk": round(acl, 1),
        "Hamstring Injury Risk": round(hamstring, 1),
        "Ankle Sprain Risk": round(ankle, 1),
        "Shoulder Injury Risk": round(shoulder, 1),
        "Lower Back Injury Risk": round(lower_back, 1),
        "Overuse Injury Risk": round(overuse, 1),
    }


# ---------------------------------------------------------------------------
# 9. Corrective Recommendation Engine
# ---------------------------------------------------------------------------

def _generate_recommendations(
    subscores: Dict[str, float],
    injury_type_risks: Dict[str, float],
    anomaly_result: dict,
    risk_category: str,
) -> List[Dict[str, str]]:
    recs: List[Dict[str, str]] = []

    if subscores["biomechanical_deviation"] > 45 or injury_type_risks["ACL Injury Risk"] > 45:
        recs.append(
            {
                "category": "strengthening",
                "title": "Hip & Glute Strengthening",
                "description": "Add glute medius / hip abductor work (banded lateral walks, single-leg bridges) 2-3x/week to reduce knee valgus under load.",
            }
        )
        recs.append(
            {
                "category": "mobility",
                "title": "Ankle & Hip Mobility",
                "description": "Daily ankle dorsiflexion and hip mobility drills to support better landing/squat mechanics.",
            }
        )

    if injury_type_risks["Hamstring Injury Risk"] > 45:
        recs.append(
            {
                "category": "exercise",
                "title": "Eccentric Hamstring Work",
                "description": "Introduce Nordic curls or Romanian deadlifts to build eccentric hamstring strength.",
            }
        )

    if injury_type_risks["Ankle Sprain Risk"] > 45:
        recs.append(
            {
                "category": "exercise",
                "title": "Balance & Proprioception",
                "description": "Single-leg balance drills on an unstable surface to improve ankle stability on landing/cutting.",
            }
        )

    if injury_type_risks["Shoulder Injury Risk"] > 45:
        recs.append(
            {
                "category": "strengthening",
                "title": "Rotator Cuff & Scapular Strengthening",
                "description": "Add external rotation and scapular stability exercises to your program.",
            }
        )

    if injury_type_risks["Lower Back Injury Risk"] > 45:
        recs.append(
            {
                "category": "strengthening",
                "title": "Core & Trunk Stability",
                "description": "Add anti-extension/anti-rotation core work (planks, dead bugs, Pallof press) to reduce excess trunk lean.",
            }
        )

    if anomaly_result.get("fatigue_detected"):
        recs.append(
            {
                "category": "recovery",
                "title": "Prioritize Recovery",
                "description": "Form breaks down later in this session — prioritize sleep, hydration, and consider an extra rest day this week.",
            }
        )

    if subscores["training_load"] > 70:
        recs.append(
            {
                "category": "training_modification",
                "title": "Reduce Training Volume",
                "description": "Training load looks high relative to recovery — consider a deload week or reducing session volume by ~20%.",
            }
        )

    if risk_category in {"High", "Critical"}:
        recs.append(
            {
                "category": "recovery",
                "title": "Consider a Physiotherapy Check-in",
                "description": "Given the current risk level, a physiotherapist assessment is recommended before the next high-intensity session.",
            }
        )

    if not recs:
        recs.append(
            {
                "category": "exercise",
                "title": "Maintain Current Program",
                "description": "Movement quality looks solid — keep up the current training and mobility routine.",
            }
        )

    return recs


# ---------------------------------------------------------------------------
# Orchestrator — called once per processed video from video_routes.py
# ---------------------------------------------------------------------------

def generate_injury_risk_assessment(
    pose_frames: List[dict],
    biomechanics_report: dict,
    athlete: Any,
    activity_type: str,
) -> dict:
    """
    pose_frames: same list passed to generate_biomechanics_report()
        ({"keypoints": {...}, "joint_angles": {...}})
    biomechanics_report: the dict returned by generate_biomechanics_report()
    athlete: the Athlete ORM object (for injury_history / training_load)
    activity_type: the Video's activity_type string

    Returns a dict matching the InjuryRiskAssessment model fields.
    """
    anomaly_result = detect_movement_anomalies(pose_frames)

    subscores = {
        "biomechanical_deviation": _score_biomechanical_deviation(biomechanics_report),
        "historical_injury": _score_historical_injury(getattr(athlete, "injury_history", None)),
        "movement_asymmetry": _score_movement_asymmetry(biomechanics_report),
        "training_load": _score_training_load(getattr(athlete, "training_load", None)),
        "fatigue": _score_fatigue(anomaly_result),
    }

    overall = round(float(sum(subscores[k] * WEIGHTS[k] for k in WEIGHTS)), 2)
    risk_category = _risk_category(overall)

    injury_type_risks = _injury_type_risks(biomechanics_report, activity_type, subscores)
    recommendations = _generate_recommendations(subscores, injury_type_risks, anomaly_result, risk_category)

    return {
        "biomechanical_deviation_score": subscores["biomechanical_deviation"],
        "historical_injury_score": subscores["historical_injury"],
        "movement_asymmetry_score": subscores["movement_asymmetry"],
        "training_load_score": subscores["training_load"],
        "fatigue_score": subscores["fatigue"],
        "overall_injury_risk_score": overall,
        "overall_athlete_health_score": round(100.0 - overall, 2),
        "risk_category": risk_category,
        "injury_type_risks": injury_type_risks,
        "anomalies_detected": anomaly_result["anomalies"],
        "fatigue_detected": "yes" if anomaly_result["fatigue_detected"] else "no",
        "recommendations": recommendations,
    }
