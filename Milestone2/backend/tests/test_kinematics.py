import pytest
from app.ml.kinematics import (
    calculate_3d_angle,
    calculate_frontal_valgus_angle,
    calculate_trunk_lean,
    calculate_asymmetry_index,
    BiomechanicalKinematicsEngine
)

def test_calculate_3d_angle_straight_and_right_angle():
    # Straight line: angle at vertex (0,0,0) between (-1,0,0) and (1,0,0) -> 180 degrees
    angle_straight = calculate_3d_angle((-1, 0, 0), (0, 0, 0), (1, 0, 0))
    assert angle_straight == 180.0

    # Right angle: (0,1,0) - (0,0,0) - (1,0,0) -> 90 degrees
    angle_90 = calculate_3d_angle((0, 1, 0), (0, 0, 0), (1, 0, 0))
    assert angle_90 == 90.0

def test_calculate_asymmetry_index():
    # Symmetric values (15 vs 15) -> 0%
    assert calculate_asymmetry_index(15.0, 15.0) == 0.0

    # Asymmetric values (10 vs 20) -> |10-20|/20 * 100 = 50%
    assert calculate_asymmetry_index(10.0, 20.0) == 50.0

def test_kinematics_engine_analysis():
    # Construct mock movement log with 10 frames
    mock_log = {
        "video_id": "VID-TEST001",
        "movement_type": "Squatting",
        "fps": 30.0,
        "total_frames": 10,
        "frames": []
    }

    # Generate 10 mock frames
    for i in range(10):
        # 33 landmarks default
        lms = []
        for idx in range(33):
            lms.append({"id": idx, "name": f"LM_{idx}", "x": 0.5, "y": 0.5, "z": 0.0, "visibility": 0.9})

        # Set key joints
        lms[11] = {"id": 11, "name": "LEFT_SHOULDER", "x": 0.42, "y": 0.28, "z": 0.0, "visibility": 0.9}
        lms[12] = {"id": 12, "name": "RIGHT_SHOULDER", "x": 0.58, "y": 0.28, "z": 0.0, "visibility": 0.9}
        lms[23] = {"id": 23, "name": "LEFT_HIP", "x": 0.45, "y": 0.50, "z": 0.0, "visibility": 0.9}
        lms[24] = {"id": 24, "name": "RIGHT_HIP", "x": 0.55, "y": 0.50, "z": 0.0, "visibility": 0.9}
        lms[25] = {"id": 25, "name": "LEFT_KNEE", "x": 0.43, "y": 0.68, "z": 0.0, "visibility": 0.9}
        lms[26] = {"id": 26, "name": "RIGHT_KNEE", "x": 0.57, "y": 0.68, "z": 0.0, "visibility": 0.9}
        lms[27] = {"id": 27, "name": "LEFT_ANKLE", "x": 0.43, "y": 0.85, "z": 0.0, "visibility": 0.9}
        lms[28] = {"id": 28, "name": "RIGHT_ANKLE", "x": 0.57, "y": 0.85, "z": 0.0, "visibility": 0.9}

        mock_log["frames"].append({
            "frame_index": i,
            "timestamp_sec": round(i / 30.0, 3),
            "landmarks": lms
        })

    engine = BiomechanicalKinematicsEngine()
    report = engine.analyze_movement_log(mock_log)

    assert report["video_id"] == "VID-TEST001"
    assert "summary_metrics" in report
    assert "time_series" in report
    assert len(report["time_series"]) == 10
    assert "risk_level" in report["summary_metrics"]
