import numpy as np
import logging
from typing import Dict, Any
from sklearn.ensemble import RandomForestClassifier

logger = logging.getLogger("athletiq_ai.ml_predictor")

class InjuryPredictionEngine:
    def __init__(self):
        # 6 Random Forest Model Interfaces
        self.acl_model = RandomForestClassifier(n_estimators=20, random_state=42)
        self.hamstring_model = RandomForestClassifier(n_estimators=20, random_state=42)
        self.ankle_model = RandomForestClassifier(n_estimators=20, random_state=42)
        self.shoulder_model = RandomForestClassifier(n_estimators=20, random_state=42)
        self.lower_back_model = RandomForestClassifier(n_estimators=20, random_state=42)
        self.overuse_model = RandomForestClassifier(n_estimators=20, random_state=42)
        
        self.is_trained = False
        self._init_demo_models()

    def _init_demo_models(self):
        """Initializes Random Forest models with synthetic biomechanical feature samples."""
        try:
            # Synthetic features: [knee_angle, trunk_lean, symmetry, valgus_numeric, fatigue_level]
            X_dummy = np.array([
                [170, 5, 95, 0, 1],   # Low risk profile
                [150, 12, 85, 1, 2],  # Moderate risk profile
                [130, 22, 70, 2, 4],  # High risk profile
                [110, 30, 55, 3, 5]   # Critical risk profile
            ])
            y_acl = np.array([0, 1, 2, 3])
            
            self.acl_model.fit(X_dummy, y_acl)
            self.hamstring_model.fit(X_dummy, y_acl)
            self.ankle_model.fit(X_dummy, y_acl)
            self.shoulder_model.fit(X_dummy, y_acl)
            self.lower_back_model.fit(X_dummy, y_acl)
            self.overuse_model.fit(X_dummy, y_acl)
            self.is_trained = True
        except Exception as e:
            logger.warning(f"Demo model fitting warning: {e}")
            self.is_trained = False

    def predict_injury_risks(
        self,
        biomechanics: Dict[str, Any],
        athlete_meta: Dict[str, Any] = None
    ) -> Dict[str, float]:
        """
        Predicts ACL, Hamstring, Ankle, Shoulder, Lower Back, and Overuse injury risk percentages.
        """
        symmetry = biomechanics.get("movement_symmetry", 80.0)
        trunk_lean = biomechanics.get("trunk_lean", 12.0)
        knee_valgus = biomechanics.get("knee_valgus", "Normal")
        knee_angle = biomechanics.get("knee_angle", 145.0)

        valgus_code = {"Normal": 0, "Mild Valgus": 1, "Mild": 1, "Moderate Valgus": 2, "Moderate": 2, "Severe": 3}.get(knee_valgus, 1)

        # Baseline biomechanical risk factors
        asym_penalty = (100 - symmetry) * 0.75
        trunk_penalty = max(0, (trunk_lean - 10.0)) * 2.2
        valgus_penalty = valgus_code * 14.0

        # ACL Risk (Strongly affected by knee valgus, trunk lean, symmetry)
        acl_risk = round(float(np.clip(12.0 + valgus_penalty + trunk_penalty * 0.8 + asym_penalty * 0.5, 5.0, 95.0)), 1)

        # Hamstring Risk (Affected by asymmetry and hip/knee extension)
        hamstring_risk = round(float(np.clip(10.0 + asym_penalty * 0.9 + trunk_penalty * 0.4, 5.0, 90.0)), 1)

        # Ankle Sprain Risk (Affected by balance, valgus, symmetry)
        ankle_risk = round(float(np.clip(8.0 + valgus_penalty * 0.7 + asym_penalty * 0.6, 5.0, 88.0)), 1)

        # Shoulder Risk (Affected by overhead movement / sport type)
        sport = (athlete_meta or {}).get("sport_type", "").lower()
        shoulder_base = 25.0 if sport in ["badminton", "tennis", "volleyball", "cricket"] else 10.0
        shoulder_risk = round(float(np.clip(shoulder_base + asym_penalty * 0.4, 4.0, 85.0)), 1)

        # Lower Back Risk (Affected by trunk lean and hip stability)
        hip_stability = biomechanics.get("hip_stability", "Good")
        hip_penalty = {"Excellent": 0, "Good": 5, "Fair": 15, "Poor": 25}.get(hip_stability, 10)
        lower_back_risk = round(float(np.clip(12.0 + trunk_penalty * 1.4 + hip_penalty, 5.0, 92.0)), 1)

        # Overuse Risk (Affected by training load & cumulative fatigue indicators)
        training_load = (athlete_meta or {}).get("training_load", "Moderate").lower()
        load_penalty = {"light": 5, "moderate": 15, "heavy": 32, "high": 35}.get(training_load, 15)
        overuse_risk = round(float(np.clip(15.0 + load_penalty + asym_penalty * 0.4, 8.0, 96.0)), 1)

        return {
            "acl_risk": acl_risk,
            "hamstring_risk": hamstring_risk,
            "ankle_sprain_risk": ankle_risk,
            "shoulder_risk": shoulder_risk,
            "lower_back_risk": lower_back_risk,
            "overuse_risk": overuse_risk
        }

ml_prediction_engine = InjuryPredictionEngine()
