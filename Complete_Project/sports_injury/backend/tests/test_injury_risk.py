"""
Milestone 4 — "Implement testing and validations" (PDF section 13).

Exercises services/injury_risk.py directly — no FastAPI app, no database.
Run with: cd backend && pytest tests/ -v
"""

import random

from services.injury_risk import (
    detect_movement_anomalies,
    generate_injury_risk_assessment,
    _risk_category,
)
from services.biomechanics import compute_joint_angles


def _pt(x, y):
    return {"x": x, "y": y, "z": 0.0, "visibility": 0.99}


def _make_frame(fatigue_factor=0.0, seed_offset=0):
    """A synthetic runner frame whose knee valgus/trunk lean worsens as
    fatigue_factor increases from 0 -> 1."""
    rnd = random.Random(42 + seed_offset)
    valgus_l = 0.01 + 0.02 * fatigue_factor + rnd.uniform(-0.002, 0.002)
    valgus_r = 0.008 + 0.018 * fatigue_factor + rnd.uniform(-0.002, 0.002)
    trunk_extra = 3 * fatigue_factor
    kp = {
        "left_hip": _pt(0.45, 0.5),
        "right_hip": _pt(0.55, 0.5),
        "left_knee": _pt(0.45 + valgus_l, 0.7),
        "right_knee": _pt(0.55 - valgus_r, 0.7),
        "left_ankle": _pt(0.45, 0.9),
        "right_ankle": _pt(0.55, 0.9),
        "left_shoulder": _pt(0.46 + trunk_extra * 0.01, 0.2),
        "right_shoulder": _pt(0.54 + trunk_extra * 0.01, 0.2),
        "left_elbow": _pt(0.4, 0.35),
        "right_elbow": _pt(0.6, 0.35),
        "left_wrist": _pt(0.38, 0.5),
        "right_wrist": _pt(0.62, 0.5),
    }
    return {"keypoints": kp, "joint_angles": compute_joint_angles(kp)}


def _fatiguing_clip(n=40):
    frames = []
    for i in range(n):
        fatigue_factor = max(0, (i - n // 2) / (n // 2))
        frames.append(_make_frame(fatigue_factor, seed_offset=i))
    return frames


def _steady_clip(n=40):
    return [_make_frame(0.0, seed_offset=i) for i in range(n)]


class FakeAthlete:
    injury_history = None
    training_load = None


def test_risk_category_boundaries():
    assert _risk_category(0) == "Low"
    assert _risk_category(29.9) == "Low"
    assert _risk_category(30) == "Moderate"
    assert _risk_category(54.9) == "Moderate"
    assert _risk_category(55) == "High"
    assert _risk_category(74.9) == "High"
    assert _risk_category(75) == "Critical"
    assert _risk_category(100) == "Critical"


def test_detect_movement_anomalies_insufficient_frames():
    result = detect_movement_anomalies([])
    assert result["fatigue_detected"] is False
    assert result["anomalies"][0]["type"] == "insufficient_data"


def test_detect_movement_anomalies_flags_fatigue_on_degrading_clip():
    result = detect_movement_anomalies(_fatiguing_clip())
    assert result["fatigue_detected"] is True
    types = {a["type"] for a in result["anomalies"]}
    assert "fatigue" in types


def test_detect_movement_anomalies_steady_clip_no_fatigue():
    result = detect_movement_anomalies(_steady_clip())
    assert result["fatigue_detected"] is False


def test_generate_injury_risk_assessment_end_to_end():
    frames = _fatiguing_clip()
    from services.biomechanics import generate_biomechanics_report

    report = generate_biomechanics_report(frames)
    result = generate_injury_risk_assessment(frames, report, FakeAthlete(), "sprinting")

    # Structural checks — every field the InjuryRiskAssessment model needs.
    for key in [
        "biomechanical_deviation_score",
        "historical_injury_score",
        "movement_asymmetry_score",
        "training_load_score",
        "fatigue_score",
        "overall_injury_risk_score",
        "overall_athlete_health_score",
        "risk_category",
        "injury_type_risks",
        "anomalies_detected",
        "fatigue_detected",
        "recommendations",
    ]:
        assert key in result

    assert 0 <= result["overall_injury_risk_score"] <= 100
    assert result["risk_category"] in {"Low", "Moderate", "High", "Critical"}
    assert result["overall_athlete_health_score"] == round(100 - result["overall_injury_risk_score"], 2)

    expected_categories = {
        "ACL Injury Risk",
        "Hamstring Injury Risk",
        "Ankle Sprain Risk",
        "Shoulder Injury Risk",
        "Lower Back Injury Risk",
        "Overuse Injury Risk",
    }
    assert set(result["injury_type_risks"].keys()) == expected_categories
    for v in result["injury_type_risks"].values():
        assert 0 <= v <= 100

    assert len(result["recommendations"]) >= 1


def test_generate_injury_risk_assessment_handles_missing_athlete_data():
    # athlete=None and an empty biomechanics report should never raise —
    # the athlete should always get *some* screening result.
    result = generate_injury_risk_assessment([], {}, None, "running")
    assert result["risk_category"] in {"Low", "Moderate", "High", "Critical"}
    assert isinstance(result["recommendations"], list)
    assert len(result["recommendations"]) >= 1


def test_high_training_load_and_history_raise_risk_vs_bare_athlete():
    frames = _steady_clip()
    from services.biomechanics import generate_biomechanics_report

    report = generate_biomechanics_report(frames)

    class BareAthlete:
        injury_history = None
        training_load = None

    class HighLoadInjuredAthlete:
        injury_history = "ACL tear 2 years ago"
        training_load = "very high, 7 sessions/week"

    bare_result = generate_injury_risk_assessment(frames, report, BareAthlete(), "running")
    loaded_result = generate_injury_risk_assessment(frames, report, HighLoadInjuredAthlete(), "running")

    assert loaded_result["overall_injury_risk_score"] > bare_result["overall_injury_risk_score"]
    assert loaded_result["historical_injury_score"] > bare_result["historical_injury_score"]
    assert loaded_result["training_load_score"] > bare_result["training_load_score"]
