import sys
import os
from typing import Optional

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend")))

from services.injury_risk_prediction import InjuryRiskPredictionEngine
from models.anomaly import MovementAnomaliesDB
from schemas.injury_risk import InjuryRiskPredictionsOut

def run_tests():
    print("Running Injury Risk Prediction Engine tests...")
    
    athlete_id = "ath_999"
    session_id = "sess_999"
    video_id = "vid_999"

    # Test Case 1: Normal metrics -> low risk
    biomech_normal = {
        "summary": {
            "max_knee_valgus_left": 2.0,
            "max_knee_valgus_right": 3.0,
            "landing_flexion_at_impact": 35.0,
            "mean_symmetry_index": 95.0,
            "average_trunk_lean": 4.0,
            "average_balance_offset": 0.02,
            "max_rom_flexion_left": 130.0,
            "max_rom_flexion_right": 128.0,
            "peak_stride_length": 0.8
        },
        "frames": [{"frame_number": i} for i in range(10)]
    }
    
    preds = InjuryRiskPredictionEngine.predict_injury_risks(
        athlete_id, session_id, video_id, biomech_normal
    )
    
    assert len(preds) == 6
    for p in preds:
        out = InjuryRiskPredictionsOut(
            _id="6a61f2260418c7444ea4c039",
            athlete_id=p.athlete_id,
            session_id=p.session_id,
            video_id=p.video_id,
            injury_type=p.injury_type,
            probability=p.probability,
            risk_level=p.risk_level,
            evidence=p.evidence,
            explanation=p.explanation,
            contributing_metrics=p.contributing_metrics,
            created_at=p.created_at
        )
        assert 0.0 <= p.probability <= 100.0
        assert p.risk_level in ["Low", "Moderate", "High", "Critical"]
        if p.injury_type in ["ACL", "Hamstring", "Ankle Sprain", "Lower Back", "Overuse"]:
            assert p.risk_level == "Low", f"{p.injury_type} expected Low, got {p.risk_level} (prob {p.probability}%)"
            
    print("Test 1 Passed: Normal metrics yield low risk across all categories.")

    # Test Case 2: High knee valgus + abnormal landing -> elevated ACL risk
    biomech_acl = {
        "summary": {
            "max_knee_valgus_left": 15.0,
            "max_knee_valgus_right": 3.0,
            "landing_flexion_at_impact": 18.0,
            "mean_symmetry_index": 95.0
        }
    }
    anom_valgus = MovementAnomaliesDB(
        athlete_id=athlete_id,
        session_id=session_id,
        video_id=video_id,
        anomaly_type="knee_valgus",
        frame_number=15,
        severity="High",
        affected_joint="Left Knee",
        observed_value=15.0,
        expected_value=10.0,
        description="High knee valgus"
    )
    
    preds_acl = InjuryRiskPredictionEngine.predict_injury_risks(
        athlete_id, session_id, video_id, biomech_acl, anomalies=[anom_valgus]
    )
    acl_pred = next(p for p in preds_acl if p.injury_type == "ACL")
    assert acl_pred.probability >= 50.0
    assert acl_pred.risk_level in ["High", "Critical"]
    print(f"Test 2 Passed: High knee valgus + stiff landing yields elevated ACL risk ({acl_pred.probability}%, {acl_pred.risk_level}).")

    # Test Case 3: Relevant hamstring abnormalities -> elevated hamstring risk
    biomech_ham = {
        "summary": {
            "max_rom_flexion_left": 130.0,
            "max_rom_flexion_right": 105.0,
            "mean_symmetry_index": 82.0
        }
    }
    profile_ham = {"injury_history": "Previous hamstring tear in 2025"}
    preds_ham = InjuryRiskPredictionEngine.predict_injury_risks(
        athlete_id, session_id, video_id, biomech_ham, athlete_profile=profile_ham
    )
    ham_pred = next(p for p in preds_ham if p.injury_type == "Hamstring")
    assert ham_pred.probability >= 50.0
    assert ham_pred.risk_level in ["High", "Critical"]
    print(f"Test 3 Passed: Hamstring ROM asymmetry + history yields elevated hamstring risk ({ham_pred.probability}%).")

    # Test Case 4: Relevant ankle/balance abnormalities -> elevated ankle risk
    biomech_ankle = {
        "summary": {
            "average_balance_offset": 0.22,
            "landing_flexion_at_impact": 18.0
        }
    }
    preds_ankle = InjuryRiskPredictionEngine.predict_injury_risks(
        athlete_id, session_id, video_id, biomech_ankle
    )
    ankle_pred = next(p for p in preds_ankle if p.injury_type == "Ankle Sprain")
    assert ankle_pred.probability >= 40.0
    assert ankle_pred.risk_level in ["Moderate", "High", "Critical"]
    print(f"Test 4 Passed: Unstable balance + stiff landing yields elevated ankle sprain risk ({ankle_pred.probability}%).")

    # Test Case 5: Relevant shoulder metrics -> shoulder risk when available
    preds_no_sh = InjuryRiskPredictionEngine.predict_injury_risks(
        athlete_id, session_id, video_id, biomech_normal
    )
    sh_pred_no = next(p for p in preds_no_sh if p.injury_type == "Shoulder")
    assert sh_pred_no.probability == 5.0
    assert sh_pred_no.risk_level == "Low"
    assert sh_pred_no.evidence["tracking_active"] is False

    anom_shoulder = MovementAnomaliesDB(
        athlete_id=athlete_id,
        session_id=session_id,
        video_id=video_id,
        anomaly_type="velocity_anomaly",
        frame_number=20,
        severity="High",
        affected_joint="LEFT_SHOULDER",
        observed_value=9.5,
        expected_value=8.0,
        description="Left shoulder acceleration spike"
    )
    preds_sh = InjuryRiskPredictionEngine.predict_injury_risks(
        athlete_id, session_id, video_id, biomech_normal, anomalies=[anom_shoulder]
    )
    sh_pred = next(p for p in preds_sh if p.injury_type == "Shoulder")
    assert sh_pred.probability > 30.0
    assert sh_pred.risk_level in ["Moderate", "High"]
    print(f"Test 5 Passed: Shoulder missing/available states handled correctly.")

    # Test Case 6: Trunk/posture abnormalities -> lower-back risk
    biomech_back = {
        "summary": {
            "average_trunk_lean": 26.0,
            "average_balance_offset": 0.12
        }
    }
    preds_back = InjuryRiskPredictionEngine.predict_injury_risks(
        athlete_id, session_id, video_id, biomech_back
    )
    back_pred = next(p for p in preds_back if p.injury_type == "Lower Back")
    assert back_pred.probability >= 40.0
    assert back_pred.risk_level in ["Moderate", "High", "Critical"]
    print(f"Test 6 Passed: High trunk lean + balance offset yields elevated lower back risk ({back_pred.probability}%).")

    # Test Case 7: Repeated movement/fatigue indicators -> overuse risk
    biomech_overuse = {
        "summary": {},
        "frames": [{"frame_number": i} for i in range(250)]
    }
    anom_fatigue = MovementAnomaliesDB(
        athlete_id=athlete_id,
        session_id=session_id,
        video_id=video_id,
        anomaly_type="fatigue_monitoring",
        frame_number=240,
        severity="High",
        affected_joint="Trunk",
        observed_value=22.0,
        expected_value=14.0,
        description="Fatigue trunk drift"
    )
    anom_decline = MovementAnomaliesDB(
        athlete_id=athlete_id,
        session_id=session_id,
        video_id=video_id,
        anomaly_type="performance_decline",
        frame_number=240,
        severity="Moderate",
        affected_joint="Stride",
        observed_value=0.55,
        expected_value=0.72,
        description="Stride compression"
    )
    profile_overuse = {"acwr": 1.75}
    
    preds_overuse = InjuryRiskPredictionEngine.predict_injury_risks(
        athlete_id, session_id, video_id, biomech_overuse,
        anomalies=[anom_fatigue, anom_decline], athlete_profile=profile_overuse
    )
    overuse_pred = next(p for p in preds_overuse if p.injury_type == "Overuse")
    assert overuse_pred.probability >= 70.0
    assert overuse_pred.risk_level in ["High", "Critical"]
    print(f"Test 7 Passed: High load counts + fatigue + decline + high ACWR yields overuse risk ({overuse_pred.probability}%).")

    # Test Case 8: Missing/safely handled fields
    preds_empty = InjuryRiskPredictionEngine.predict_injury_risks(
        athlete_id, session_id, video_id, {}
    )
    assert len(preds_empty) == 6
    for p in preds_empty:
        assert p.risk_level == "Low"
    print("Test 8 Passed: Missing data handled safely by returning low risk baselines.")

    print("\nALL INJURY RISK PREDICTION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
