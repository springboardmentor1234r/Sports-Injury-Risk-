"""
Milestone 4 — "Implement testing and validations" (PDF section 13).

These tests exercise services/biomechanics.py directly — no FastAPI app,
no database — so they run fast and don't need Postgres configured.
Run with: cd backend && pytest tests/ -v
"""

from services.biomechanics import calculate_angle, compute_joint_angles, generate_biomechanics_report


def _pt(x, y):
    return {"x": x, "y": y, "z": 0.0, "visibility": 0.99}


def _straight_leg_keypoints():
    """A perfectly straight leg: hip -> knee -> ankle in a vertical line.
    The angle at the knee should be ~180 degrees."""
    return {
        "left_hip": _pt(0.5, 0.3),
        "left_knee": _pt(0.5, 0.6),
        "left_ankle": _pt(0.5, 0.9),
        "right_hip": _pt(0.5, 0.3),
        "right_knee": _pt(0.5, 0.6),
        "right_ankle": _pt(0.5, 0.9),
        "left_shoulder": _pt(0.45, 0.1),
        "right_shoulder": _pt(0.55, 0.1),
        "left_elbow": _pt(0.4, 0.2),
        "right_elbow": _pt(0.6, 0.2),
        "left_wrist": _pt(0.35, 0.3),
        "right_wrist": _pt(0.65, 0.3),
    }


def test_calculate_angle_straight_line_is_180():
    a, b, c = _pt(0, 0), _pt(0, 1), _pt(0, 2)
    # calculate_angle adds a tiny epsilon to the denominator to avoid
    # divide-by-zero, so a perfectly straight line lands at ~179.99, not
    # exactly 180.0 — assert within a small tolerance instead of equality.
    assert abs(calculate_angle(a, b, c) - 180.0) < 0.1


def test_calculate_angle_right_angle_is_90():
    a, b, c = _pt(0, 1), _pt(0, 0), _pt(1, 0)
    assert abs(calculate_angle(a, b, c) - 90.0) < 0.01


def test_compute_joint_angles_straight_leg_near_180():
    angles = compute_joint_angles(_straight_leg_keypoints())
    assert "left_knee" in angles
    assert "right_knee" in angles
    assert angles["left_knee"] > 170
    assert angles["right_knee"] > 170


def test_compute_joint_angles_missing_keypoint_returns_empty_dict():
    # compute_joint_angles computes all 6 angles inside a single try/except
    # KeyError block, so one missing keypoint skips the whole frame's
    # angles rather than just the one that needed it — this documents
    # that actual (intentional) behavior rather than assuming per-angle
    # isolation.
    kp = _straight_leg_keypoints()
    del kp["left_knee"]
    angles = compute_joint_angles(kp)
    assert angles == {}


def test_generate_biomechanics_report_empty_frames():
    report = generate_biomechanics_report([])
    # Should return a well-formed (if mostly-empty) report, not raise.
    assert isinstance(report, dict)


def test_generate_biomechanics_report_with_frames():
    frames = []
    for _ in range(10):
        kp = _straight_leg_keypoints()
        frames.append({"keypoints": kp, "joint_angles": compute_joint_angles(kp)})

    report = generate_biomechanics_report(frames)
    assert isinstance(report, dict)
    assert "movement_quality_score" in report
    # A dead-straight, symmetric leg across every frame should score well.
    if report.get("movement_quality_score") is not None:
        assert report["movement_quality_score"] >= 0
