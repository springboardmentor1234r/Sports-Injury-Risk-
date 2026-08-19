"""
tests/test_biomechanics.py
-----------------------------
Unit tests for the joint-angle math in services/biomechanics.py.

These use hand-constructed landmark coordinates (not real MediaPipe output)
specifically so the expected angle is known in advance and independently
verifiable -- this tests the geometry, not MediaPipe's detection accuracy
(that's verified separately, against a real photo, in the pose_estimation
service).

Coordinate note: MediaPipe's y-axis grows downward (0 = top of frame, 1 =
bottom), matching standard image coordinates. So "leg pointing straight down"
means increasing y as you go from hip to ankle.
"""

import pytest
from app.services.biomechanics import calculate_angle, compute_frame_angles, summarize_video
from app.services.pose_estimation import LANDMARK_NAMES


def make_landmark(x, y, z=0.0, visibility=0.99):
    return {"x": x, "y": y, "z": z, "visibility": visibility}


def make_full_landmark_set(overrides: dict) -> list:
    """
    Builds a full 33-point landmark list (MediaPipe's fixed order), with
    default low-visibility placeholder points everywhere except the named
    joints supplied in `overrides` (e.g. {"left_hip": (0.5, 0.5)}).
    """
    landmarks = [make_landmark(0.0, 0.0, visibility=0.0) for _ in LANDMARK_NAMES]
    for name, (x, y) in overrides.items():
        idx = LANDMARK_NAMES.index(name)
        landmarks[idx] = make_landmark(x, y, visibility=0.99)
    return landmarks


class TestCalculateAngle:
    def test_straight_line_is_180_degrees(self):
        # hip -> knee -> ankle all in a vertical line = fully extended leg
        assert calculate_angle((0, 0), (0, 1), (0, 2)) == 180.0

    def test_right_angle_is_90_degrees(self):
        assert calculate_angle((0, 1), (0, 0), (1, 0)) == 90.0

    def test_zero_length_vector_returns_none(self):
        # vertex coincides with one of the other points -- undefined angle
        assert calculate_angle((0, 0), (0, 0), (1, 1)) is None


class TestComputeFrameAngles:
    def test_fully_extended_knee_reads_close_to_180(self):
        landmarks = make_full_landmark_set({
            "left_hip": (0.5, 0.5),
            "left_knee": (0.5, 0.7),
            "left_ankle": (0.5, 0.9),
        })
        angles = compute_frame_angles(landmarks)
        assert angles["left_knee_angle"] == pytest.approx(180.0, abs=0.1)

    def test_bent_knee_reads_a_smaller_angle(self):
        # knee bent sharply forward relative to hip-ankle line
        landmarks = make_full_landmark_set({
            "left_hip": (0.5, 0.5),
            "left_knee": (0.6, 0.7),
            "left_ankle": (0.5, 0.85),
        })
        angles = compute_frame_angles(landmarks)
        assert angles["left_knee_angle"] < 180.0
        assert angles["left_knee_angle"] > 0

    def test_missing_low_confidence_joint_returns_none_not_a_number(self):
        # left_knee is left at default (0.0 visibility) -- should not fabricate an angle
        landmarks = make_full_landmark_set({
            "left_hip": (0.5, 0.5),
            "left_ankle": (0.5, 0.9),
        })
        angles = compute_frame_angles(landmarks)
        assert angles["left_knee_angle"] is None

    def test_upright_trunk_reads_close_to_zero_lean(self):
        landmarks = make_full_landmark_set({
            "left_shoulder": (0.45, 0.2), "right_shoulder": (0.55, 0.2),
            "left_hip": (0.45, 0.5), "right_hip": (0.55, 0.5),
        })
        angles = compute_frame_angles(landmarks)
        assert angles["trunk_lean_angle"] == pytest.approx(0.0, abs=0.5)

    def test_leaning_trunk_reads_nonzero_lean(self):
        landmarks = make_full_landmark_set({
            "left_shoulder": (0.60, 0.2), "right_shoulder": (0.70, 0.2),
            "left_hip": (0.45, 0.5), "right_hip": (0.55, 0.5),
        })
        angles = compute_frame_angles(landmarks)
        assert angles["trunk_lean_angle"] > 5.0

    def test_empty_landmarks_returns_all_none(self):
        angles = compute_frame_angles(None)
        assert all(v is None for v in angles.values())


class TestSummarizeVideo:
    def test_computes_min_max_avg_range_of_motion(self):
        frames = [
            {"left_knee_angle": 170.0, "right_knee_angle": 172.0},
            {"left_knee_angle": 90.0, "right_knee_angle": 95.0},
            {"left_knee_angle": 175.0, "right_knee_angle": 170.0},
        ]
        result = summarize_video(frames)
        left = result["joint_angles"]["left_knee_angle"]
        assert left["min"] == 90.0
        assert left["max"] == 175.0
        assert left["range_of_motion"] == 85.0
        assert left["avg"] == pytest.approx((170 + 90 + 175) / 3, abs=0.01)

    def test_symmetric_knees_score_near_zero(self):
        frames = [
            {"left_knee_angle": 170.0, "right_knee_angle": 171.0},
            {"left_knee_angle": 90.0, "right_knee_angle": 91.0},
        ]
        result = summarize_video(frames)
        # left ROM = 80, right ROM = 80 -> symmetry score should be ~0
        assert result["knee_symmetry_score"] == pytest.approx(0.0, abs=0.5)

    def test_asymmetric_knees_score_high(self):
        frames = [
            {"left_knee_angle": 170.0, "right_knee_angle": 170.0},
            {"left_knee_angle": 90.0, "right_knee_angle": 150.0},  # left bends far more than right
        ]
        result = summarize_video(frames)
        assert result["knee_symmetry_score"] > 30

    def test_missing_metric_returns_none_not_a_crash(self):
        result = summarize_video([{"left_knee_angle": None, "right_knee_angle": None}])
        assert result["joint_angles"]["left_knee_angle"] is None
        assert result["knee_symmetry_score"] is None

    def test_empty_frame_list_does_not_crash(self):
        result = summarize_video([])
        assert result["knee_symmetry_score"] is None
