import sys
import os
from typing import Optional

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend")))

from services.risk_scoring import RiskScoringEngine
from models.anomaly import MovementAnomaliesDB
from models.injury_risk import InjuryRiskPredictionsDB
from schemas.risk_score import RiskScoresOut

def run_tests():
    print("Running Weighted Risk Scoring Engine tests...")
    
    athlete_id = "ath_888"
    session_id = "sess_888"
    video_id = "vid_888"

    # Test Case 1: Normal athlete data -> Low risk
    biomech_normal = {
        "summary": {
            "max_knee_valgus_left": 2.0,
            "max_knee_valgus_right": 2.5,
            "landing_flexion_at_impact": 35.0,
            "mean_symmetry_index": 95.0,
            "average_trunk_lean": 4.0,
            "average_balance_offset": 0.02
        },
        "frames": [{"frame_number": i} for i in range(10)]
    }
    profile_normal = {"injury_history": "None", "acwr": 1.0}
    
    res = RiskScoringEngine.calculate_risk_score(
        athlete_id, session_id, video_id, biomech_normal, athlete_profile=profile_normal
    )

    # 1. Verify weights sum to 100%
    w = res.weighted_factors
    total_weight = (
        w.biomechanical_deviations +
        w.historical_injury_factors +
        w.movement_asymmetry +
        w.training_load_indicators +
        w.fatigue_indicators
    )
    assert abs(total_weight - 1.0) < 1e-5, f"Expected weights to sum to 1.0, got {total_weight}"
    print("Test 1 Passed: Exact weights sum to 100% (1.0).")

    # 2. Schema compatibility & output bounds validation
    out_obj = RiskScoresOut(
        _id="6a61f2260418c7444ea4c039",
        athlete_id=res.athlete_id,
        session_id=res.session_id,
        video_id=res.video_id,
        biomechanical_score=res.biomechanical_score,
        history_score=res.history_score,
        asymmetry_score=res.asymmetry_score,
        load_score=res.load_score,
        fatigue_score=res.fatigue_score,
        weighted_factors=res.weighted_factors.model_dump(),
        overall_injury_risk_score=res.overall_injury_risk_score,
        movement_quality_score=res.movement_quality_score,
        biomechanical_efficiency_score=res.biomechanical_efficiency_score,
        fatigue_risk_score=res.fatigue_risk_score,
        overall_athlete_health_score=res.overall_athlete_health_score,
        risk_category=res.risk_category,
        score_breakdown=res.score_breakdown,
        created_at=res.created_at
    )
    assert 0.0 <= res.overall_injury_risk_score <= 100.0
    assert 0.0 <= res.movement_quality_score <= 100.0
    assert 0.0 <= res.overall_athlete_health_score <= 100.0
    assert res.risk_category == "Low"
    print("Test 2 Passed: Low risk and schema validations succeeded.")

    # 3. Biomechanical deviations effect
    biomech_bad = {
        "summary": {
            "max_knee_valgus_left": 18.0,      # bad valgus
            "landing_flexion_at_impact": 18.0,  # stiff landing
            "average_trunk_lean": 24.0,         # lean
            "mean_symmetry_index": 95.0,
            "average_balance_offset": 0.02
        }
    }
    res_bad_bio = RiskScoringEngine.calculate_risk_score(
        athlete_id, session_id, video_id, biomech_bad, athlete_profile=profile_normal
    )
    assert res_bad_bio.overall_injury_risk_score > res.overall_injury_risk_score
    print(f"Test 3 Passed: Biomechanical deviations increased risk ({res_bad_bio.overall_injury_risk_score}% vs {res.overall_injury_risk_score}%).")

    # 4. Asymmetry effect
    biomech_asym = {
        "summary": {
            "max_knee_valgus_left": 2.0,
            "landing_flexion_at_impact": 35.0,
            "average_trunk_lean": 4.0,
            "mean_symmetry_index": 72.0,  # bad asymmetry
            "average_balance_offset": 0.02
        }
    }
    res_asym = RiskScoringEngine.calculate_risk_score(
        athlete_id, session_id, video_id, biomech_asym, athlete_profile=profile_normal
    )
    assert res_asym.overall_injury_risk_score > res.overall_injury_risk_score
    assert res_asym.asymmetry_score > 0.0
    print(f"Test 4 Passed: Movement asymmetry increased risk ({res_asym.overall_injury_risk_score}%).")

    # 5. History + Load + Fatigue incorporation and missing data handling
    # Check neutral fallback when history and load profiles are empty/missing
    res_empty_profile = RiskScoringEngine.calculate_risk_score(
        athlete_id, session_id, video_id, biomech_normal, athlete_profile=None
    )
    assert res_empty_profile.history_score == 15.0  # neutral history
    assert res_empty_profile.load_score == 20.0     # neutral load
    assert "injury history" in " ".join(res_empty_profile.score_breakdown["data_limitations"]).lower()
    print("Test 5 Passed: Missing history/load profiles handled safely with neutral defaults.")

    # 6. Fatigue indicators & Anomaly Consumption
    anom_fatigue = MovementAnomaliesDB(
        athlete_id=athlete_id,
        session_id=session_id,
        video_id=video_id,
        anomaly_type="fatigue_monitoring",
        frame_number=90,
        severity="High",
        affected_joint="Trunk",
        observed_value=22.0,
        expected_value=15.0,
        description="Fatigue trunk drift"
    )
    pred_overuse = InjuryRiskPredictionsDB(
        athlete_id=athlete_id,
        session_id=session_id,
        video_id=video_id,
        injury_type="Overuse",
        probability=65.0,
        risk_level="High",
        evidence={},
        explanation="High overuse probability",
        contributing_metrics=[]
    )
    res_fatigue = RiskScoringEngine.calculate_risk_score(
        athlete_id, session_id, video_id, biomech_normal,
        anomalies=[anom_fatigue], predictions=[pred_overuse], athlete_profile=profile_normal
    )
    assert res_fatigue.fatigue_risk_score == 55.0  # 35 for fatigue + 20 for overuse risk prediction
    assert res_fatigue.overall_injury_risk_score > res.overall_injury_risk_score
    print("Test 6 Passed: Fatigue anomalies and overuse risk predictions successfully consumed.")

    # 7. Verify score breakdown math is exact
    b = res_fatigue.score_breakdown["factors"]
    calculated_sum = (
        b["biomechanical"]["contribution"] +
        b["history"]["contribution"] +
        b["asymmetry"]["contribution"] +
        b["training_load"]["contribution"] +
        b["fatigue"]["contribution"]
    )
    assert abs(res_fatigue.overall_injury_risk_score - calculated_sum) < 1e-2
    print("Test 7 Passed: Score breakdown mathematical verification is completely accurate.")

    print("\nALL weighted RISK SCORING TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
