import os
import sys
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))
from models.risk_score import RiskScoresDB, WeightedFactors
from models.anomaly import MovementAnomaliesDB
from models.injury_risk import InjuryRiskPredictionsDB

# Configurable Scoring Category Thresholds
THRESHOLD_SCORE_MODERATE = 25.0
THRESHOLD_SCORE_HIGH = 50.0
THRESHOLD_SCORE_CRITICAL = 75.0

class RiskScoringEngine:
    @staticmethod
    def get_risk_category(score: float) -> str:
        """
        Maps the final composite injury risk score to a qualitative category.
        """
        if score < THRESHOLD_SCORE_MODERATE:
            return "Low"
        elif score < THRESHOLD_SCORE_HIGH:
            return "Moderate"
        elif score < THRESHOLD_SCORE_CRITICAL:
            return "High"
        else:
            return "Critical"

    @staticmethod
    def calculate_risk_score(
        athlete_id: str,
        session_id: str,
        video_id: str,
        biomechanics_data: Dict[str, Any],
        skeleton_data: Optional[Dict[str, Any]] = None,
        anomalies: Optional[List[MovementAnomaliesDB]] = None,
        predictions: Optional[List[InjuryRiskPredictionsDB]] = None,
        athlete_profile: Optional[Dict[str, Any]] = None
    ) -> RiskScoresDB:
        """
        Calculates Overall Injury Risk, Movement Quality, Biomechanical Efficiency, Fatigue Risk,
        and overall Athlete Health scores using the exact 5-factor weighted scoring engine.
        Returns a validated RiskScoresDB instance.
        """
        anomalies = anomalies or []
        predictions = predictions or []
        summary = biomechanics_data.get("summary", {})
        data_limitations = []

        # ----------------------------------------------------
        # 1. Biomechanical Deviations (35%)
        # ----------------------------------------------------
        biomech_score = 0.0
        has_biomech = bool(summary)
        
        if has_biomech:
            # Score based on joint angles & landing flexion deviations
            max_valgus = max(summary.get("max_knee_valgus_left", 0.0), summary.get("max_knee_valgus_right", 0.0))
            if max_valgus > 10.0:
                biomech_score += min(40.0, (max_valgus - 10.0) * 4.0)
                
            landing_angle = summary.get("landing_flexion_at_impact", 0.0)
            if 0.0 < landing_angle < 30.0:
                biomech_score += (30.0 - landing_angle) * 2.0

            trunk_lean = summary.get("average_trunk_lean", 0.0)
            if trunk_lean > 15.0:
                biomech_score += min(30.0, (trunk_lean - 15.0) * 2.0)
            
            # Incorporate step 3 anomalies (e.g. knee valgus, trunk lean)
            bio_anoms = [a for a in anomalies if a.anomaly_type in ["knee_valgus", "excessive_trunk_lean"]]
            for ba in bio_anoms:
                if ba.severity == "Low":
                    biomech_score += 5.0
                elif ba.severity == "Moderate":
                    biomech_score += 10.0
                elif ba.severity == "High":
                    biomech_score += 20.0
                elif ba.severity == "Critical":
                    biomech_score += 30.0
            
            # Incorporate step 4 predictions (elevated ACL or lower back risks)
            acl_pred = next((p for p in predictions if p.injury_type == "ACL"), None)
            if acl_pred and acl_pred.probability > 50.0:
                biomech_score += 15.0
        else:
            data_limitations.append("Biomechanical summaries are missing. Scoring uses default normal indices.")
        
        biomech_score = min(100.0, max(0.0, biomech_score))

        # ----------------------------------------------------
        # 2. Historical Injury Factors (20%)
        # ----------------------------------------------------
        history_score = 0.0
        has_history = False
        
        if athlete_profile and "injury_history" in athlete_profile:
            has_history = True
            hist = athlete_profile["injury_history"]
            if hist and hist.strip().lower() not in ["none", "no", "n/a"]:
                # Substantial history yields higher risk
                history_score = 85.0
            else:
                history_score = 0.0
        else:
            # NEUTRAL HANDLING: Assign low baseline neutral risk of 15.0
            history_score = 15.0
            data_limitations.append("Athlete injury history profile is missing. Applied neutral low baseline risk.")

        # ----------------------------------------------------
        # 3. Movement Asymmetry (20%)
        # ----------------------------------------------------
        asymmetry_score = 0.0
        has_asymmetry = False
        
        symmetry_idx = summary.get("mean_symmetry_index")
        if symmetry_idx is not None:
            has_asymmetry = True
            if symmetry_idx < 90.0:
                # Lower index yields higher asymmetry score
                asymmetry_score += (90.0 - symmetry_idx) * 4.0
            else:
                asymmetry_score += max(0.0, (100.0 - symmetry_idx) * 1.5)
            
            # Incorporate step 3 asymmetry anomalies
            asym_anoms = [a for a in anomalies if a.anomaly_type == "movement_asymmetry"]
            asymmetry_score += len(asym_anoms) * 15.0
        else:
            # Check for asymmetry anomalies even if summary symmetry is absent
            asym_anoms = [a for a in anomalies if a.anomaly_type == "movement_asymmetry"]
            if asym_anoms:
                has_asymmetry = True
                asymmetry_score = min(100.0, len(asym_anoms) * 25.0)
            else:
                data_limitations.append("Movement symmetry logs are missing. Assumed symmetric baseline.")

        asymmetry_score = min(100.0, max(0.0, asymmetry_score))

        # ----------------------------------------------------
        # 4. Training Load Indicators (15%)
        # ----------------------------------------------------
        load_score = 0.0
        has_load = False
        
        if athlete_profile and "acwr" in athlete_profile:
            has_load = True
            acwr = athlete_profile["acwr"]
            if acwr is not None:
                if 0.8 <= acwr <= 1.3:
                    load_score = 10.0  # Normal safe training zone
                elif acwr < 0.8:
                    load_score = 45.0  # Under-training load risk
                elif 1.3 < acwr <= 1.5:
                    load_score = 60.0  # Elevated load risk
                else:
                    load_score = 90.0  # Critical overuse loading
        else:
            # NEUTRAL HANDLING: Assign neutral baseline of 20.0
            load_score = 20.0
            data_limitations.append("Training load ratio (ACWR) log is missing. Applied neutral zone baseline.")

        # ----------------------------------------------------
        # 5. Fatigue Indicators (10%)
        # ----------------------------------------------------
        fatigue_score = 0.0
        has_fatigue = False
        
        fatigue_anoms = [a for a in anomalies if a.anomaly_type == "fatigue_monitoring"]
        decline_anoms = [a for a in anomalies if a.anomaly_type == "performance_decline"]
        
        if fatigue_anoms or decline_anoms:
            has_fatigue = True
            fatigue_score += len(fatigue_anoms) * 35.0
            fatigue_score += len(decline_anoms) * 30.0
            
            # Step 4 Overuse probability helps weight fatigue
            overuse_pred = next((p for p in predictions if p.injury_type == "Overuse"), None)
            if overuse_pred and overuse_pred.probability > 50.0:
                fatigue_score += 20.0
        else:
            # Check frame duration
            num_frames = len(biomechanics_data.get("frames", []))
            if num_frames > 0:
                has_fatigue = True
                if num_frames > 200:
                    fatigue_score = 25.0  # Mild fatigue from long duration
            else:
                data_limitations.append("Fatigue telemetry checks are missing (insufficient frame sequence duration).")

        fatigue_score = min(100.0, max(0.0, fatigue_score))

        # ----------------------------------------------------
        # Final Score Compilation
        # ----------------------------------------------------
        weights = WeightedFactors()
        
        overall_injury_risk_score = (
            biomech_score * weights.biomechanical_deviations +
            history_score * weights.historical_injury_factors +
            asymmetry_score * weights.movement_asymmetry +
            load_score * weights.training_load_indicators +
            fatigue_score * weights.fatigue_indicators
        )
        
        # Calculate derived scores
        # 100 represents perfect quality/health, whereas 0 is worst.
        # Overall risk represents higher threat, so health is reversed.
        overall_athlete_health_score = max(0.0, 100.0 - overall_injury_risk_score)
        biomechanical_efficiency_score = max(0.0, 100.0 - biomech_score)
        
        # Movement quality is derived from biomechanical deviations and symmetry issues
        movement_quality_score = max(0.0, 100.0 - (biomech_score * 0.5 + asymmetry_score * 0.5))
        fatigue_risk_score = fatigue_score

        risk_cat = RiskScoringEngine.get_risk_category(overall_injury_risk_score)

        # Audit details mapping
        score_breakdown = {
            "factors": {
                "biomechanical": {
                    "score": round(biomech_score, 2),
                    "weight": weights.biomechanical_deviations,
                    "contribution": round(biomech_score * weights.biomechanical_deviations, 2),
                    "status": "active" if has_biomech else "unavailable"
                },
                "history": {
                    "score": round(history_score, 2),
                    "weight": weights.historical_injury_factors,
                    "contribution": round(history_score * weights.historical_injury_factors, 2),
                    "status": "active" if has_history else "neutral_default"
                },
                "asymmetry": {
                    "score": round(asymmetry_score, 2),
                    "weight": weights.movement_asymmetry,
                    "contribution": round(asymmetry_score * weights.movement_asymmetry, 2),
                    "status": "active" if has_asymmetry else "unavailable"
                },
                "training_load": {
                    "score": round(load_score, 2),
                    "weight": weights.training_load_indicators,
                    "contribution": round(load_score * weights.training_load_indicators, 2),
                    "status": "active" if has_load else "neutral_default"
                },
                "fatigue": {
                    "score": round(fatigue_score, 2),
                    "weight": weights.fatigue_indicators,
                    "contribution": round(fatigue_score * weights.fatigue_indicators, 2),
                    "status": "active" if has_fatigue else "neutral_default"
                }
            },
            "data_limitations": data_limitations
        }

        return RiskScoresDB(
            athlete_id=athlete_id,
            session_id=session_id,
            video_id=video_id,
            biomechanical_score=round(biomech_score, 2),
            history_score=round(history_score, 2),
            asymmetry_score=round(asymmetry_score, 2),
            load_score=round(load_score, 2),
            fatigue_score=round(fatigue_score, 2),
            weighted_factors=weights,
            overall_injury_risk_score=round(overall_injury_risk_score, 2),
            movement_quality_score=round(movement_quality_score, 2),
            biomechanical_efficiency_score=round(biomechanical_efficiency_score, 2),
            fatigue_risk_score=round(fatigue_risk_score, 2),
            overall_athlete_health_score=round(overall_athlete_health_score, 2),
            risk_category=risk_cat,
            score_breakdown=score_breakdown
        )
