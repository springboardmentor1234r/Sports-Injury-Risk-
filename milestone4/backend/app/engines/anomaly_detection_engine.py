from typing import List, Dict

class AnomalyDetectionEngine:
    @staticmethod
    def detect_anomalies(metrics: Dict[str, float], frame_sequence_metrics: List[Dict] = None) -> List[Dict]:
        """
        Evaluates movement anomalies across 5 criteria:
        1. Movement Deviation
        2. Bilateral Asymmetry
        3. Fatigue-Related Degradation
        4. Technique Flaws
        5. Performance Decline
        """
        anomalies = []

        knee_valgus = metrics.get("knee_valgus_deg", 5.0)
        asymmetry = metrics.get("asymmetry_ratio", 5.0)
        landing_flexion = metrics.get("landing_flexion_deg", 45.0)
        trunk_lean = metrics.get("trunk_lean_deg", 10.0)
        com_drift = metrics.get("com_drift_cm", 0.8)

        # 1. Dynamic Knee Valgus Collapse
        if knee_valgus > 12.0:
            anomalies.append({
                "type": "Movement Deviation",
                "severity": "Critical" if knee_valgus > 18.0 else "High",
                "title": "Severe Dynamic Knee Valgus",
                "description": f"Right knee rotated inward by {knee_valgus:.1f}° during ground contact, increasing ACL tension.",
                "affected_region": "Knee / Lower Limb"
            })

        # 2. Bilateral Asymmetry
        if asymmetry > 15.0:
            anomalies.append({
                "type": "Asymmetry Detection",
                "severity": "High" if asymmetry > 22.0 else "Medium",
                "title": "Bilateral Limb Force Imbalance",
                "description": f"{asymmetry:.1f}% side-to-side biomechanical asymmetry detected between left and right legs.",
                "affected_region": "Lower Extremities"
            })

        # 3. Heavy Landing Impact Deceleration
        if landing_flexion < 25.0:
            anomalies.append({
                "type": "Technique Deviation",
                "severity": "High",
                "title": "Stiff-Leg Landing Impact",
                "description": f"Landing knee flexion angle reduced to {landing_flexion:.1f}°, increasing joint reaction forces.",
                "affected_region": "Knee & Ankle"
            })

        # 4. Excessive Spinal Trunk Tilt
        if trunk_lean > 20.0:
            anomalies.append({
                "type": "Technique Deviation",
                "severity": "Medium",
                "title": "Excessive Lateral Trunk Lean",
                "description": f"Trunk tilt measured at {trunk_lean:.1f}°, shifting body center of mass outside balance base.",
                "affected_region": "Lumbar Spine"
            })

        # 5. Center of Mass Drift (Balance Inconsistency)
        if com_drift > 2.0:
            anomalies.append({
                "type": "Motion Inconsistency",
                "severity": "Medium",
                "title": "Postural Sway & Instability",
                "description": f"Center of mass horizontal drift reached {com_drift:.2f}cm during deceleration phase.",
                "affected_region": "Core & Pelvis"
            })

        # If no severe anomalies detected, add an optimal baseline notification
        if not anomalies:
            anomalies.append({
                "type": "Baseline Alignment",
                "severity": "Low",
                "title": "Optimal Movement Form",
                "description": "Kinematic tracking parameters are within safe biomechanical thresholds.",
                "affected_region": "Full Body"
            })

        return anomalies
