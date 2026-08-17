from typing import Dict, Any

class RiskScoringEngine:
    def calculate_overall_risk(
        self,
        biomechanics: Dict[str, Any],
        predictions: Dict[str, float],
        anomaly: Dict[str, Any],
        athlete_meta: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Calculates overall injury risk score using exact weighted formula:
        Overall Injury Risk = Biomechanical Deviations * 0.35 + Historical Factors * 0.20 + Movement Asymmetry * 0.20 + Training Load * 0.15 + Fatigue * 0.10
        """
        athlete_meta = athlete_meta or {}
        
        # 1. Biomechanical Deviations (35%)
        knee_valgus = biomechanics.get("knee_valgus", "Normal")
        trunk_lean = biomechanics.get("trunk_lean", 10.0)
        valgus_pts = {"Normal": 10, "Mild Valgus": 35, "Mild": 35, "Moderate Valgus": 65, "Moderate": 65, "Severe": 90}.get(knee_valgus, 20)
        trunk_pts = min(100.0, max(0.0, (trunk_lean - 8.0) * 4.5))
        biomechanical_deviations = (valgus_pts * 0.6) + (trunk_pts * 0.4)

        # 2. Historical Injury Factors (20%)
        history_str = str(athlete_meta.get("injury_history", "")).lower()
        if "acl" in history_str or "surgery" in history_str:
            historical_factors = 75.0
        elif "sprain" in history_str or "strain" in history_str or "tear" in history_str:
            historical_factors = 45.0
        elif history_str != "" and history_str != "none" and history_str != "none reported":
            historical_factors = 30.0
        else:
            historical_factors = 15.0

        # 3. Movement Asymmetry (20%)
        symmetry = biomechanics.get("movement_symmetry", 85.0)
        movement_asymmetry = max(0.0, min(100.0, (100.0 - symmetry) * 3.2))

        # 4. Training Load Indicators (15%)
        load_str = str(athlete_meta.get("training_load", "Moderate")).lower()
        training_load_score = {"light": 15.0, "moderate": 35.0, "heavy": 70.0, "high": 75.0, "extreme": 90.0}.get(load_str, 35.0)

        # 5. Fatigue Indicators (10%)
        anomaly_score = anomaly.get("anomaly_score", 0.2)
        fatigue_score = min(100.0, (anomaly_score * 70.0) + (training_load_score * 0.3))

        # Weighted Calculation
        overall_risk = round(
            (biomechanical_deviations * 0.35) +
            (historical_factors * 0.20) +
            (movement_asymmetry * 0.20) +
            (training_load_score * 0.15) +
            (fatigue_score * 0.10),
            1
        )
        overall_risk = max(0.0, min(100.0, overall_risk))

        # Determine Risk Level
        if overall_risk <= 25.0:
            risk_level = "Low Risk"
        elif overall_risk <= 50.0:
            risk_level = "Moderate Risk"
        elif overall_risk <= 75.0:
            risk_level = "High Risk"
        else:
            risk_level = "Critical Risk"

        # Scores calculation
        movement_quality_score = round(max(40.0, 100.0 - (biomechanical_deviations * 0.5) - (movement_asymmetry * 0.4)), 1)
        biomechanical_efficiency = round(max(45.0, (symmetry * 0.6) + ((100 - trunk_pts) * 0.4)), 1)
        fatigue_risk_score = round(fatigue_score, 1)
        overall_health_score = round(max(35.0, 100.0 - (overall_risk * 0.6) - (fatigue_score * 0.2)), 1)

        return {
            "overall_risk_score": overall_risk,
            "risk_level": risk_level,
            "movement_quality_score": movement_quality_score,
            "biomechanical_efficiency_score": biomechanical_efficiency,
            "fatigue_risk_score": fatigue_risk_score,
            "overall_health_score": overall_health_score,
            "breakdown": {
                "biomechanical_deviations": round(biomechanical_deviations, 1),
                "historical_factors": round(historical_factors, 1),
                "movement_asymmetry": round(movement_asymmetry, 1),
                "training_load": round(training_load_score, 1),
                "fatigue": round(fatigue_score, 1)
            }
        }

risk_scoring_engine = RiskScoringEngine()
