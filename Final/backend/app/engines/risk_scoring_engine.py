from typing import Dict, List

class RiskScoringEngine:
    @staticmethod
    def compute_scores(predictions: Dict[str, Dict], anomalies: List[Dict], metrics: Dict[str, float]) -> Dict[str, int]:
        """
        Computes composite Injury Risk Score using the exact weighted 5-factor model:
        - Biomechanical Deviations (35%)
        - Historical Injury Factors (20%)
        - Movement Asymmetry (20%)
        - Training Load Indicators (15%)
        - Fatigue Indicators (10%)
        """
        # 1. Biomechanical Deviations (35%) — derived from ML category risk scores & joint deviations
        category_scores = [v["score"] for v in predictions.values()]
        avg_category_risk = sum(category_scores) / len(category_scores) if category_scores else 20.0
        biomechanical_deviations = min(100.0, max(0.0, avg_category_risk))

        # 2. Historical Injury Factors (20%) — derived from injury history flag & past injury severity
        has_history = metrics.get("has_injury_history", 0)
        historical_injury_factors = 75.0 if has_history == 1 else 15.0

        # 3. Movement Asymmetry (20%) — derived from bilateral asymmetry ratio
        asymmetry_ratio = metrics.get("asymmetry_ratio", 8.6)
        movement_asymmetry = min(100.0, max(0.0, asymmetry_ratio * 4.0))

        # 4. Training Load Indicators (15%) — derived from weekly training hours
        training_load_hrs = metrics.get("training_load_hrs", 14.0)
        training_load_indicators = min(100.0, max(0.0, (training_load_hrs / 30.0) * 100.0))

        # 5. Fatigue Indicators (10%) — derived from kinematic form collapse & deceleration shock
        knee_valgus_deg = metrics.get("knee_valgus_deg", 8.5)
        fatigue_indicators = min(100.0, max(0.0, knee_valgus_deg * 4.5 + (100 - metrics.get("landing_flexion_deg", 30.0))))

        # Calculate exact weighted composite Injury Risk Score
        weighted_injury_risk = (
            (biomechanical_deviations * 0.35) +
            (historical_injury_factors * 0.20) +
            (movement_asymmetry * 0.20) +
            (training_load_indicators * 0.15) +
            (fatigue_indicators * 0.10)
        )

        injury_risk_score = min(98, max(5, int(round(weighted_injury_risk))))

        # Derived composite metrics
        movement_quality_score = min(99, max(10, 100 - int(round(biomechanical_deviations))))
        symmetry_score = max(30, min(99, int(round(100 - movement_asymmetry))))
        fatigue_score = min(98, max(10, int(round(fatigue_indicators))))
        overall_health = max(15, min(99, int(round((movement_quality_score * 0.4) + (symmetry_score * 0.3) + ((100 - fatigue_score) * 0.3)))))

        return {
            "injury_risk_score": injury_risk_score,
            "movement_quality_score": movement_quality_score,
            "symmetry_score": symmetry_score,
            "fatigue_score": fatigue_score,
            "overall_health_score": overall_health,
            "breakdown": {
                "biomechanical_deviations_score": int(round(biomechanical_deviations)),
                "historical_injury_score": int(round(historical_injury_factors)),
                "movement_asymmetry_score": int(round(movement_asymmetry)),
                "training_load_score": int(round(training_load_indicators)),
                "fatigue_score": int(round(fatigue_indicators))
            }
        }

    @staticmethod
    def compute_risk_trend(history_scores: List[int]) -> Dict[str, str]:
        """Calculates risk trend trajectory across historical sessions."""
        if not history_scores or len(history_scores) < 2:
            return {"direction": "Stable", "delta": "0%", "status": "Optimal"}

        latest = history_scores[-1]
        previous = history_scores[-2]
        diff = latest - previous

        if diff < -3:
            return {"direction": "Improving", "delta": f"{abs(diff)}% reduction", "status": "Positive Progress"}
        elif diff > 3:
            return {"direction": "Declining", "delta": f"+{diff}% increase", "status": "Warning: Risk Escalation"}
        else:
            return {"direction": "Stable", "delta": "Maintained", "status": "Steady Alignment"}
