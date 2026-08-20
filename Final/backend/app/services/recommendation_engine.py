import os
import sys
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))
from models.recommendation import RecommendationsDB
from models.anomaly import MovementAnomaliesDB
from models.injury_risk import InjuryRiskPredictionsDB
from models.risk_score import RiskScoresDB

class RecommendationEngine:
    @staticmethod
    def get_priority(severity_or_prob: Any) -> str:
        """
        Maps a severity name or probability value to a standard priority:
        Low, Medium, High, Critical.
        """
        if isinstance(severity_or_prob, (int, float)):
            prob = float(severity_or_prob)
            if prob >= 75.0:
                return "Critical"
            elif prob >= 50.0:
                return "High"
            elif prob >= 25.0:
                return "Medium"
            else:
                return "Low"
        
        # String severity mapping
        severity = str(severity_or_prob).capitalize()
        if severity == "Critical":
            return "Critical"
        elif severity == "High":
            return "High"
        elif severity == "Moderate":
            return "Medium"
        else:
            return "Low"

    @staticmethod
    def generate_recommendations(
        athlete_id: str,
        session_id: str,
        anomalies: Optional[List[MovementAnomaliesDB]] = None,
        predictions: Optional[List[InjuryRiskPredictionsDB]] = None,
        risk_score: Optional[RiskScoresDB] = None
    ) -> List[RecommendationsDB]:
        """
        Generates personalized, non-duplicate recommendations based on detected risks and anomalies.
        Returns a list of populated RecommendationsDB objects.
        """
        recommendations = []
        anomalies = anomalies or []
        predictions = predictions or []
        
        # Map inputs by type for easy lookups
        anom_types = {a.anomaly_type: a for a in anomalies}
        pred_types = {p.injury_type: p for p in predictions}

        # ----------------------------------------------------
        # 1. ACL Risk / Knee Valgus
        # ----------------------------------------------------
        has_valgus = "knee_valgus" in anom_types
        acl_pred = pred_types.get("ACL")
        acl_prob = acl_pred.probability if acl_pred else 0.0
        
        if has_valgus or acl_prob >= 40.0:
            valgus_anom = anom_types.get("knee_valgus")
            highest_sev = valgus_anom.severity if valgus_anom else "Low"
            priority = RecommendationEngine.get_priority(max(acl_prob, 50.0 if highest_sev == "High" else 20.0))
            
            # Corrective Exercises Suggestion
            valgus_str = f"observed peak: {valgus_anom.observed_value:.1f}°" if valgus_anom else "no valgus peak"
            recommendations.append(RecommendationsDB(
                athlete_id=athlete_id,
                session_id=session_id,
                recommendation_type="Corrective Exercises",
                title="Knee Valgus Correction & Alignment Drills",
                description="Perform band-resisted squats, lateral band walks, and single-leg glute bridges to coach alignment and prevent inward knee collapse.",
                priority=priority,
                related_risk="ACL",
                related_anomaly="knee_valgus",
                reason_evidence=f"Suggested due to knee valgus patterns ({valgus_str}) and elevated ACL risk prediction ({acl_prob:.1f}%)."
            ))
            
            # Strengthening Suggestion
            recommendations.append(RecommendationsDB(
                athlete_id=athlete_id,
                session_id=session_id,
                recommendation_type="Strengthening",
                title="Gluteus Medius & Hip Abductor Conditioning",
                description="Focus on hip abductors and external rotators (clamshells, side-lying hip abductions) to stabilize the femur during movement.",
                priority=priority,
                related_risk="ACL",
                related_anomaly="knee_valgus",
                reason_evidence="Weak hip external rotators are highly associated with knee valgus collapse under load."
            ))

        # ----------------------------------------------------
        # 2. Trunk Lean / Lower Back Risk
        # ----------------------------------------------------
        has_lean = "excessive_trunk_lean" in anom_types
        back_pred = pred_types.get("Lower Back")
        back_prob = back_pred.probability if back_pred else 0.0

        if has_lean or back_prob >= 40.0:
            lean_anom = anom_types.get("excessive_trunk_lean")
            highest_sev = lean_anom.severity if lean_anom else "Low"
            priority = RecommendationEngine.get_priority(max(back_prob, 50.0 if highest_sev == "High" else 20.0))

            # Corrective Exercises
            lean_str = f"observed trunk lean: {lean_anom.observed_value:.1f}°" if lean_anom else "no trunk lean anomaly"
            recommendations.append(RecommendationsDB(
                athlete_id=athlete_id,
                session_id=session_id,
                recommendation_type="Corrective Exercises",
                title="Core Stability & Lumbar Control",
                description="Engage in bird-dogs, front/side planks, and dead-bugs to build core stability and control trunk sway.",
                priority=priority,
                related_risk="Lower Back",
                related_anomaly="excessive_trunk_lean",
                reason_evidence=f"Flagged due to trunk lean deviations ({lean_str}) and elevated lower back load risk."
            ))
            
            # Mobility
            recommendations.append(RecommendationsDB(
                athlete_id=athlete_id,
                session_id=session_id,
                recommendation_type="Mobility",
                title="Thoracic Spine & Hip Flexor Mobility",
                description="Perform active hip flexor stretches and thoracic extensions on a foam roller to prevent lower back hyperextension.",
                priority=priority,
                related_risk="Lower Back",
                related_anomaly="excessive_trunk_lean",
                reason_evidence="Limited thoracic extension and hip flexor tightness can cause compensatory trunk lean."
            ))

        # ----------------------------------------------------
        # 3. Asymmetry / Hamstring Risk
        # ----------------------------------------------------
        has_asym = "movement_asymmetry" in anom_types
        ham_pred = pred_types.get("Hamstring")
        ham_prob = ham_pred.probability if ham_pred else 0.0

        if has_asym or ham_prob >= 40.0:
            asym_anom = anom_types.get("movement_asymmetry")
            highest_sev = asym_anom.severity if asym_anom else "Low"
            priority = RecommendationEngine.get_priority(max(ham_prob, 50.0 if highest_sev == "High" else 20.0))

            # Strengthening
            recommendations.append(RecommendationsDB(
                athlete_id=athlete_id,
                session_id=session_id,
                recommendation_type="Strengthening",
                title="Unilateral Lower Limb Strength Conditioning",
                description="Incorporate single-leg Romanian deadlifts, Bulgarian split squats, and single-leg calf raises to resolve left/right imbalances.",
                priority=priority,
                related_risk="Hamstring",
                related_anomaly="movement_asymmetry",
                reason_evidence=f"Generated due to bilateral movement asymmetry and elevated hamstring strain risk ({ham_prob:.1f}%)."
            ))
            
            # Mobility
            recommendations.append(RecommendationsDB(
                athlete_id=athlete_id,
                session_id=session_id,
                recommendation_type="Mobility",
                title="Posterior Chain Range-of-Motion Balance",
                description="Perform hamstring sweeps, dynamic leg swings, and ankle dorsiflexion stretches to resolve asymmetric limb restriction.",
                priority=priority,
                related_risk="Hamstring",
                related_anomaly="movement_asymmetry",
                reason_evidence="Significant left/right ROM differences increase shear strain on the tight hamstring during sprinting."
            ))

        # ----------------------------------------------------
        # 4. Landing Abnormality / Ankle Sprain Risk
        # ----------------------------------------------------
        has_landing = "landing_abnormality" in anom_types
        ankle_pred = pred_types.get("Ankle Sprain")
        ankle_prob = ankle_pred.probability if ankle_pred else 0.0

        if has_landing or ankle_prob >= 40.0:
            landing_anom = anom_types.get("landing_abnormality")
            highest_sev = landing_anom.severity if landing_anom else "Low"
            priority = RecommendationEngine.get_priority(max(ankle_prob, 50.0 if highest_sev == "High" else 20.0))

            # Corrective Exercises
            landing_str = f"observed knee landing flexion: {landing_anom.observed_value:.1f}°" if landing_anom else "no landing anomaly"
            recommendations.append(RecommendationsDB(
                athlete_id=athlete_id,
                session_id=session_id,
                recommendation_type="Corrective Exercises",
                title="Landing Mechanics & Soft Impact Drills",
                description="Practice drop landings from a box, focusing on landing softly with deep knee/hip flexion to absorb vertical impact forces.",
                priority=priority,
                related_risk="Ankle Sprain",
                related_anomaly="landing_abnormality",
                reason_evidence=f"Identified stiff landing impact mechanics ({landing_str})."
            ))
            
            # Mobility
            recommendations.append(RecommendationsDB(
                athlete_id=athlete_id,
                session_id=session_id,
                recommendation_type="Mobility",
                title="Ankle Dorsiflexion & Stability Training",
                description="Perform ankle mobilization exercises against a wall and single-leg balance board drills to restore postural control.",
                priority=priority,
                related_risk="Ankle Sprain",
                related_anomaly="landing_abnormality",
                reason_evidence="Stiff landing impact vectors are often linked to restricted ankle dorsiflexion range-of-motion."
            ))

        # ----------------------------------------------------
        # 5. Overuse Risk / Fatigue / Decline
        # ----------------------------------------------------
        has_fatigue = "fatigue_monitoring" in anom_types
        has_decline = "performance_decline" in anom_types
        overuse_pred = pred_types.get("Overuse")
        overuse_prob = overuse_pred.probability if overuse_pred else 0.0

        if has_fatigue or has_decline or overuse_prob >= 40.0:
            fatigue_anom = anom_types.get("fatigue_monitoring") or anom_types.get("performance_decline")
            highest_sev = fatigue_anom.severity if fatigue_anom else "Low"
            priority = RecommendationEngine.get_priority(max(overuse_prob, 50.0 if highest_sev == "High" else 20.0))

            # Recovery
            recommendations.append(RecommendationsDB(
                athlete_id=athlete_id,
                session_id=session_id,
                recommendation_type="Recovery",
                title="Active Recovery & Sleep Hygiene Protocol",
                description="Prioritize active recovery, foam rolling, and light stretching. Limit high-intensity training loads for the next 48 hours.",
                priority=priority,
                related_risk="Overuse",
                related_anomaly="fatigue_monitoring",
                reason_evidence=f"Generated due to fatigue indicators, performance decline, or high overuse risk ({overuse_prob:.1f}%)."
            ))
            
            # Training/Load Modification
            recommendations.append(RecommendationsDB(
                athlete_id=athlete_id,
                session_id=session_id,
                recommendation_type="Training/Load Modification",
                title="Training Volume & ACWR Adjustments",
                description="Reduce overall session volume. Ensure gradual progression to maintain the acute-to-chronic workload ratio inside [0.8, 1.3].",
                priority=priority,
                related_risk="Overuse",
                related_anomaly="performance_decline",
                reason_evidence="Elevated overuse risks require immediate training volume moderation to prevent chronic muscle/tendon strain."
            ))

        # ----------------------------------------------------
        # 6. Upper Body / Shoulder Risk
        # ----------------------------------------------------
        sh_pred = pred_types.get("Shoulder")
        sh_prob = sh_pred.probability if sh_pred else 0.0
        
        # Check if upper body evidence actually exists (active tracking)
        has_shoulder_evidence = sh_pred and sh_pred.evidence.get("tracking_active", False)
        
        if has_shoulder_evidence and sh_prob >= 40.0:
            priority = RecommendationEngine.get_priority(sh_prob)
            
            # Strengthening
            recommendations.append(RecommendationsDB(
                athlete_id=athlete_id,
                session_id=session_id,
                recommendation_type="Strengthening",
                title="Rotator Cuff & Scapular Stability",
                description="Perform band-resisted external shoulder rotations, face pulls, and Y-T-W raises to stabilize the shoulder complex.",
                priority=priority,
                related_risk="Shoulder",
                related_anomaly=None,
                reason_evidence=f"Flagged due to dynamic shoulder asymmetry and elevated shoulder joint loading risk ({sh_prob:.1f}%)."
            ))

        # ----------------------------------------------------
        # 7. General baseline (if no issues are flagged)
        # ----------------------------------------------------
        if not recommendations:
            recommendations.append(RecommendationsDB(
                athlete_id=athlete_id,
                session_id=session_id,
                recommendation_type="Training/Load Modification",
                title="Maintain Conditioning Baseline",
                description="Joint kinematics and limb movement symmetries look excellent. Continue current dynamic warmup routines and loading progressions.",
                priority="Low",
                related_risk=None,
                related_anomaly=None,
                reason_evidence="Kinematic analysis indicates normal movement ranges and symmetry. No corrective alignment triggers met."
            ))

        return recommendations
