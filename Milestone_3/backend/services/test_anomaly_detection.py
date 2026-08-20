import sys
import os
from typing import Optional

# Add milestone3 backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))
# Add sports-injury-risk backend directory to sys.path to find 'app'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend")))

from services.anomaly_detection import AnomalyDetectionEngine

def run_tests():
    print("Running Anomaly Detection Engine tests...")
    
    athlete_id = "ath_123"
    session_id = "sess_123"
    video_id = "vid_123"

    # Test Case 1: Normal biomechanical values (no anomalies expected)
    biomech_normal = {
        "frames": [
            {
                "frame_number": 1,
                "timestamp": 0.04,
                "joint_angles": {"knee_valgus_left": 2.0, "knee_valgus_right": 2.5},
                "trunk_lean": 5.0,
                "symmetry_difference": 95.0,  # dev is 5.0 (allowed gap is 10.0)
                "landing_angle": 35.0,       # above threshold 30
                "stride_length": 0.8
            }
        ]
    }
    anoms = AnomalyDetectionEngine.detect_anomalies(athlete_id, session_id, video_id, biomech_normal)
    assert len(anoms) == 0, f"Expected 0 anomalies, got {len(anoms)}"
    print("Test 1 Passed: Normal biomechanics yield no anomalies.")

    # Test Case 2: Excessive Knee Valgus Left
    biomech_valgus = {
        "frames": [
            {
                "frame_number": 1,
                "timestamp": 0.04,
                "joint_angles": {"knee_valgus_left": 15.0, "knee_valgus_right": 2.5},
                "trunk_lean": 5.0,
                "symmetry_difference": 95.0,
                "landing_angle": 35.0
            }
        ]
    }
    anoms = AnomalyDetectionEngine.detect_anomalies(athlete_id, session_id, video_id, biomech_valgus)
    assert len(anoms) == 1, f"Expected 1 anomaly, got {len(anoms)}"
    assert anoms[0].anomaly_type == "knee_valgus"
    assert anoms[0].affected_joint == "Left Knee"
    assert anoms[0].severity == "Moderate"  # dev is 5.0, base is 10.0 -> ratio 0.5 (Moderate)
    print("Test 2 Passed: Knee valgus detected with correct severity.")

    # Test Case 3: Excessive Trunk Lean
    biomech_lean = {
        "frames": [
            {
                "frame_number": 1,
                "timestamp": 0.04,
                "joint_angles": {"knee_valgus_left": 2.0, "knee_valgus_right": 2.5},
                "trunk_lean": 30.0,  # threshold 15.0
                "symmetry_difference": 95.0,
                "landing_angle": 35.0
            }
        ]
    }
    anoms = AnomalyDetectionEngine.detect_anomalies(athlete_id, session_id, video_id, biomech_lean)
    assert len(anoms) == 1
    assert anoms[0].anomaly_type == "excessive_trunk_lean"
    assert anoms[0].severity == "Critical"  # dev is 15.0, base is 15.0 -> ratio 1.0 (Critical)
    print("Test 3 Passed: Trunk lean detected with Critical severity.")

    # Test Case 4: Left/Right Asymmetry
    biomech_asym = {
        "frames": [
            {
                "frame_number": 1,
                "timestamp": 0.04,
                "joint_angles": {"knee_valgus_left": 2.0, "knee_valgus_right": 2.5},
                "trunk_lean": 5.0,
                "symmetry_difference": 80.0,  # dev is 20.0 > allowed gap 10.0
                "landing_angle": 35.0
            }
        ]
    }
    anoms = AnomalyDetectionEngine.detect_anomalies(athlete_id, session_id, video_id, biomech_asym)
    assert len(anoms) == 1
    assert anoms[0].anomaly_type == "movement_asymmetry"
    print("Test 4 Passed: Movement asymmetry detected.")

    # Test Case 5: Landing Abnormality (touchdown stiff knee)
    biomech_landing = {
        "frames": [
            {
                "frame_number": 1,
                "timestamp": 0.04,
                "joint_angles": {"knee_valgus_left": 2.0, "knee_valgus_right": 2.5},
                "trunk_lean": 5.0,
                "symmetry_difference": 95.0,
                "landing_angle": 15.0  # expected >= 30.0
            }
        ]
    }
    anoms = AnomalyDetectionEngine.detect_anomalies(athlete_id, session_id, video_id, biomech_landing)
    assert len(anoms) == 1
    assert anoms[0].anomaly_type == "landing_abnormality"
    print("Test 5 Passed: Landing stiffness detected.")

    # Test Case 6: Large velocity/acceleration change
    biomech_mock = {
        "frames": [
            {
                "frame_number": 1,
                "timestamp": 0.04,
                "joint_angles": {},
                "trunk_lean": 5.0,
                "symmetry_difference": 95.0
            }
        ]
    }
    skel_data = {
        "frames": [
            {
                "frame_number": 1,
                "timestamp": 0.04,
                "joint_accelerations": {"LEFT_ANKLE": 12.0},  # exceeds 8.0
                "tracking_confidence": 0.95
            }
        ]
    }
    anoms = AnomalyDetectionEngine.detect_anomalies(athlete_id, session_id, video_id, biomech_mock, skel_data)
    assert len(anoms) == 1
    assert anoms[0].anomaly_type == "velocity_anomaly"
    print("Test 6 Passed: Velocity/acceleration spike detected.")

    # Test Case 7: Deduplication of consecutive frames
    biomech_consecutive = {
        "frames": [
            {
                "frame_number": 1,
                "timestamp": 0.04,
                "joint_angles": {"knee_valgus_left": 12.0},  # valgus!
                "trunk_lean": 5.0,
                "symmetry_difference": 95.0
            },
            {
                "frame_number": 2,
                "timestamp": 0.08,
                "joint_angles": {"knee_valgus_left": 15.0},  # valgus peak!
                "trunk_lean": 5.0,
                "symmetry_difference": 95.0
            },
            {
                "frame_number": 3,
                "timestamp": 0.12,
                "joint_angles": {"knee_valgus_left": 11.0},  # valgus!
                "trunk_lean": 5.0,
                "symmetry_difference": 95.0
            }
        ]
    }
    anoms = AnomalyDetectionEngine.detect_anomalies(athlete_id, session_id, video_id, biomech_consecutive)
    assert len(anoms) == 1, f"Expected deduplication to yield 1 peak anomaly, got {len(anoms)}"
    assert anoms[0].frame_number == 2, f"Expected peak frame number 2, got {anoms[0].frame_number}"
    assert anoms[0].observed_value == 15.0
    print("Test 7 Passed: Consecutive abnormal frames deduplicated successfully.")

    # Test Case 8: Missing/insufficient data handling safely
    anoms = AnomalyDetectionEngine.detect_anomalies(athlete_id, session_id, video_id, {})
    assert len(anoms) == 0
    print("Test 8 Passed: Safely handles empty biomechanical dict.")

    print("\nALL ANOMALY DETECTOR TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
