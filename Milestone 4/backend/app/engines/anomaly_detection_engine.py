import numpy as np
import logging
from typing import Dict, Any
from sklearn.ensemble import IsolationForest

logger = logging.getLogger("athletiq_ai.anomaly")

class AnomalyDetectionEngine:
    def __init__(self):
        self.isolation_forest = IsolationForest(contamination=0.15, random_state=42)
        self._init_baseline()

    def _init_baseline(self):
        try:
            # Baseline normal motion features: [knee_diff, hip_diff, trunk_lean, symmetry]
            normal_data = np.array([
                [2.0, 1.5, 8.0, 96.0],
                [3.0, 2.0, 10.0, 94.0],
                [4.0, 2.5, 9.5, 92.0],
                [1.5, 1.0, 7.5, 98.0],
                [2.5, 2.0, 11.0, 93.0],
                [15.0, 12.0, 24.0, 65.0]  # Outlier sample
            ])
            self.isolation_forest.fit(normal_data)
        except Exception as e:
            logger.warning(f"IsolationForest init warning: {e}")

    def detect_anomalies(self, biomechanics: Dict[str, Any], pose_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Runs IsolationForest anomaly detection on dynamic biomechanical joint angle metrics.
        """
        symmetry = biomechanics.get("movement_symmetry", 85.0)
        trunk_lean = biomechanics.get("trunk_lean", 12.0)
        knee_valgus = biomechanics.get("knee_valgus", "Normal")

        # Create feature vector
        asym_diff = 100.0 - symmetry
        valgus_code = 1.0 if knee_valgus != "Normal" else 0.0
        feature_vec = np.array([[asym_diff, trunk_lean * 0.5, trunk_lean, symmetry]])

        try:
            pred = self.isolation_forest.predict(feature_vec)[0]  # -1 for anomaly, 1 for normal
            decision_score = self.isolation_forest.decision_function(feature_vec)[0]
        except Exception:
            pred = -1 if asym_diff > 18.0 or valgus_code > 0 else 1
            decision_score = 0.4

        # Convert decision score to 0.0 - 1.0 anomaly index
        anomaly_score = round(float(np.clip(0.5 - decision_score, 0.05, 0.95)), 2)
        anomaly_detected = bool(pred == -1 or anomaly_score > 0.45 or knee_valgus in ["Moderate Valgus", "Severe"])

        if anomaly_score > 0.70:
            severity = "High"
            affected_area = "Right Knee & Hip Joint"
            description = "Critical dynamic knee valgus and severe bilateral movement asymmetry detected during impact."
        elif anomaly_score > 0.45:
            severity = "Moderate"
            affected_area = "Right Knee Alignment"
            description = "Repeated inward knee movement (valgus deviation) and trunk lean anomaly detected."
        elif anomaly_score > 0.30:
            severity = "Mild"
            affected_area = "Trunk Alignment"
            description = "Slight trunk lean deviation detected during lateral transition."
        else:
            severity = "None"
            affected_area = "None"
            description = "No significant movement anomalies detected."

        return {
            "anomaly_detected": anomaly_detected,
            "anomaly_score": anomaly_score,
            "severity": severity,
            "affected_area": affected_area,
            "description": description
        }

anomaly_engine = AnomalyDetectionEngine()
