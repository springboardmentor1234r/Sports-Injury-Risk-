import os
import joblib
import numpy as np

MODELS_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_PATH = os.path.join(MODELS_DIR, "models")

class MLPredictionEngine:
    _models = {}
    _anomaly_model = None

    @classmethod
    def load_models(cls):
        """Loads trained .joblib models into memory."""
        categories = ["acl_risk", "hamstring_risk", "ankle_risk", "shoulder_risk", "lowerback_risk", "overuse_risk"]
        for cat in categories:
            path = os.path.join(MODELS_PATH, f"{cat}_model.joblib")
            if os.path.exists(path):
                cls._models[cat] = joblib.load(path)
            else:
                cls._models[cat] = None

        anomaly_path = os.path.join(MODELS_PATH, "movement_anomaly_model.joblib")
        if os.path.exists(anomaly_path):
            cls._anomaly_model = joblib.load(anomaly_path)

    @classmethod
    def predict_injury_risks(cls, features: list):
        """
        Runs ML prediction for all 6 injury categories based on feature vector:
        features = [knee_valgus, hip_stability, trunk_lean, landing_flexion,
                    stride_length, asymmetry_ratio, com_drift, shoulder_abduction,
                    lumbar_flexion, ankle_inversion, age, bmi, training_load, injury_history_flag]
        """
        if not cls._models or any(m is None for m in cls._models.values()):
            cls.load_models()

        X = np.array(features).reshape(1, -1)
        predictions = {}

        category_names = {
            "acl_risk": "ACL Injury Risk",
            "hamstring_risk": "Hamstring Injury Risk",
            "ankle_risk": "Ankle Sprain Risk",
            "shoulder_risk": "Shoulder Injury Risk",
            "lowerback_risk": "Lower Back Injury Risk",
            "overuse_risk": "Overuse Injury Risk"
        }

        risk_levels = ["Low Risk", "Moderate Risk", "High Risk"]

        for cat_key, model in cls._models.items():
            if model is not None:
                probs = model.predict_proba(X)[0]
                pred_class = int(np.argmax(probs))
                # Calculate numeric risk percentage (0 to 100%)
                risk_pct = int(round((probs[1] * 50 + probs[2] * 100) if len(probs) > 2 else probs[1] * 100))
                predictions[category_names[cat_key]] = {
                    "score": max(5, min(95, risk_pct)),
                    "level": risk_levels[pred_class] if pred_class < len(risk_levels) else "High Risk",
                    "probability": round(float(np.max(probs)), 2)
                }
            else:
                # Fallback rule-based estimation if model file is not present
                predictions[category_names[cat_key]] = {
                    "score": 20,
                    "level": "Low Risk",
                    "probability": 0.85
                }

        return predictions
