import sys
import os
from typing import Optional

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend")))

from services.recommendation_engine import RecommendationEngine
from models.anomaly import MovementAnomaliesDB
from models.injury_risk import InjuryRiskPredictionsDB
from schemas.recommendation import RecommendationsOut

def run_tests():
    print("Running Recommendation Engine tests...")
    
    athlete_id = "ath_777"
    session_id = "sess_777"
    video_id = "vid_777"

    # Test Case 1: Normal athlete (low risk) -> minimal/general recommendation
    recs = RecommendationEngine.generate_recommendations(
        athlete_id, session_id, anomalies=[], predictions=[]
    )
    assert len(recs) == 1
    assert recs[0].recommendation_type == "Training/Load Modification"
    assert recs[0].priority == "Low"
    assert "Maintain Conditioning Baseline" in recs[0].title
    
    # Schema check
    out_obj = RecommendationsOut(
        _id="6a61f2260418c7444ea4c039",
        athlete_id=recs[0].athlete_id,
        session_id=recs[0].session_id,
        recommendation_type=recs[0].recommendation_type,
        title=recs[0].title,
        description=recs[0].description,
        priority=recs[0].priority,
        related_risk=recs[0].related_risk,
        related_anomaly=recs[0].related_anomaly,
        reason_evidence=recs[0].reason_evidence,
        created_at=recs[0].created_at
    )
    print("Test 1 Passed: Normal/low-risk returns baseline low priority guidelines.")

    # Test Case 2: Knee valgus anomaly -> knee control drills
    anom_valgus = MovementAnomaliesDB(
        athlete_id=athlete_id, session_id=session_id, video_id=video_id,
        anomaly_type="knee_valgus", frame_number=12, severity="High",
        affected_joint="Left Knee", observed_value=14.0, expected_value=10.0,
        description="High knee valgus"
    )
    recs_valgus = RecommendationEngine.generate_recommendations(
        athlete_id, session_id, anomalies=[anom_valgus], predictions=[]
    )
    assert len(recs_valgus) == 2
    types = [r.recommendation_type for r in recs_valgus]
    assert "Corrective Exercises" in types
    assert "Strengthening" in types
    assert any("Knee Valgus Correction" in r.title for r in recs_valgus)
    print("Test 2 Passed: Knee valgus yields correct exercise and strengthening recommendations.")

    # Test Case 3: High ACL risk -> knee control, abductor strengthening
    pred_acl = InjuryRiskPredictionsDB(
        athlete_id=athlete_id, session_id=session_id, video_id=video_id,
        injury_type="ACL", probability=80.0, risk_level="Critical",
        evidence={}, explanation="High ACL risk", contributing_metrics=[]
    )
    recs_acl = RecommendationEngine.generate_recommendations(
        athlete_id, session_id, anomalies=[], predictions=[pred_acl]
    )
    assert len(recs_acl) == 2
    assert any(r.priority == "Critical" for r in recs_acl)
    print("Test 3 Passed: High ACL risk yields critical priority abductor recommendations.")

    # Test Case 4: Trunk lean -> core core/posture stability
    anom_lean = MovementAnomaliesDB(
        athlete_id=athlete_id, session_id=session_id, video_id=video_id,
        anomaly_type="excessive_trunk_lean", frame_number=20, severity="High",
        affected_joint="Trunk", observed_value=22.0, expected_value=15.0,
        description="Excessive trunk lean"
    )
    recs_lean = RecommendationEngine.generate_recommendations(
        athlete_id, session_id, anomalies=[anom_lean]
    )
    assert any("Core Stability" in r.title for r in recs_lean)
    print("Test 4 Passed: Trunk lean yields core control stability drill.")

    # Test Case 5: Asymmetry -> unilateral/balance exercises
    anom_asym = MovementAnomaliesDB(
        athlete_id=athlete_id, session_id=session_id, video_id=video_id,
        anomaly_type="movement_asymmetry", frame_number=18, severity="High",
        affected_joint="Bilateral Limbs", observed_value=15.0, expected_value=10.0,
        description="Asymmetry"
    )
    recs_asym = RecommendationEngine.generate_recommendations(
        athlete_id, session_id, anomalies=[anom_asym]
    )
    assert any("Unilateral Lower Limb" in r.title for r in recs_asym)
    print("Test 5 Passed: Asymmetry yields unilateral strengthening exercise.")

    # Test Case 6: Landing abnormality -> soft impact drills
    anom_landing = MovementAnomaliesDB(
        athlete_id=athlete_id, session_id=session_id, video_id=video_id,
        anomaly_type="landing_abnormality", frame_number=45, severity="High",
        affected_joint="Knee", observed_value=12.0, expected_value=30.0,
        description="Landing stiffness"
    )
    recs_landing = RecommendationEngine.generate_recommendations(
        athlete_id, session_id, anomalies=[anom_landing]
    )
    assert any("Soft Impact Drills" in r.title for r in recs_landing)
    print("Test 6 Passed: Landing stiffness yields landing mechanics drill.")

    # Test Case 7: Fatigue / Overuse risk -> recovery, volume reduction
    anom_fatigue = MovementAnomaliesDB(
        athlete_id=athlete_id, session_id=session_id, video_id=video_id,
        anomaly_type="fatigue_monitoring", frame_number=85, severity="High",
        affected_joint="Trunk", observed_value=22.0, expected_value=15.0,
        description="Fatigue drift"
    )
    recs_fatigue = RecommendationEngine.generate_recommendations(
        athlete_id, session_id, anomalies=[anom_fatigue]
    )
    types_fatigue = [r.recommendation_type for r in recs_fatigue]
    assert "Recovery" in types_fatigue
    assert "Training/Load Modification" in types_fatigue
    print("Test 7 Passed: Fatigue yields recovery and volume reduction recommendation.")

    # Test Case 8: Shoulder recommendations only when active tracking evidence exists
    pred_sh_no_evidence = InjuryRiskPredictionsDB(
        athlete_id=athlete_id, session_id=session_id, video_id=video_id,
        injury_type="Shoulder", probability=60.0, risk_level="High",
        evidence={"tracking_active": False}, explanation="Low upper-body tracking",
        contributing_metrics=[]
    )
    recs_sh_no = RecommendationEngine.generate_recommendations(
        athlete_id, session_id, anomalies=[], predictions=[pred_sh_no_evidence]
    )
    assert not any("Shoulder" in r.related_risk for r in recs_sh_no if r.related_risk)

    pred_sh_evidence = InjuryRiskPredictionsDB(
        athlete_id=athlete_id, session_id=session_id, video_id=video_id,
        injury_type="Shoulder", probability=60.0, risk_level="High",
        evidence={"tracking_active": True}, explanation="Upper back asymmetry",
        contributing_metrics=[]
    )
    recs_sh = RecommendationEngine.generate_recommendations(
        athlete_id, session_id, anomalies=[], predictions=[pred_sh_evidence]
    )
    assert any("Shoulder" in r.related_risk for r in recs_sh if r.related_risk)
    print("Test 8 Passed: Shoulder recommendations dynamically limit to active tracking evidence.")

    print("\nALL RECOMMENDATION ENGINE TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
