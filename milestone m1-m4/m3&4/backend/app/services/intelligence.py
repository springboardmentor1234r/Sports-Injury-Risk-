"""Explainable, rule-based athlete intelligence built from existing project data.

The service deliberately produces analytical estimates, not medical diagnoses or
claims of clinical accuracy. Scores are persisted so trends can be audited.
"""
import datetime
import json
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app import models
from app.services.analytics import BiomechanicalAnalytics, OvertrainingRiskAnalytics


WEIGHTS = {
    "biomechanical_deviations": 35,
    "historical_injury_factors": 20,
    "movement_asymmetry": 20,
    "training_load_indicators": 15,
    "fatigue_indicators": 10,
}
DISCLAIMER = "Analytical risk estimate only; it is not a medical diagnosis or validated clinical prediction."


def clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return round(max(low, min(high, value)), 1)


def severity_for(score: float) -> str:
    if score >= 75:
        return "Critical"
    if score >= 50:
        return "High"
    if score >= 25:
        return "Moderate"
    return "Low"


class AthleteIntelligenceService:
    @staticmethod
    def latest_biomechanics(db: Session, athlete_id: int) -> tuple[Optional[models.Video], Dict[str, Any]]:
        video = db.query(models.Video).filter(
            models.Video.athlete_id == athlete_id,
            models.Video.status == "analyzed",
        ).order_by(models.Video.uploaded_at.desc()).first()
        if video and video.skeletal_data:
            return video, BiomechanicalAnalytics.analyze_skeletal_data(video.skeletal_data)
        return None, {
            "max_extension_angle": 180.0, "max_flexion_angle": 180.0,
            "flexion_velocity": 0.0, "symmetry_index": 100.0,
            "posture_deviation_score": 0.0,
        }

    @staticmethod
    def detect_anomalies(metrics: Dict[str, Any], video_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Detect only deviations supported by available derived pose metrics."""
        findings: List[Dict[str, Any]] = []
        symmetry = float(metrics.get("symmetry_index", 100))
        posture = float(metrics.get("posture_deviation_score", 0))
        flexion = float(metrics.get("max_flexion_angle", 180))
        velocity = float(metrics.get("flexion_velocity", 0))
        if symmetry < 92:
            findings.append({"anomaly_type": "left_right_asymmetry", "severity": "High" if symmetry < 85 else "Moderate", "frame_index": None, "body_region": "lower limbs", "explanation": f"Derived bilateral knee symmetry was {symmetry}%, below the 92% review threshold.", "recommended_action": "Review single-leg control and landing mechanics with a qualified coach or clinician."})
        if posture > 15:
            findings.append({"anomaly_type": "posture_deviation", "severity": "High" if posture > 30 else "Moderate", "frame_index": None, "body_region": "hips/trunk", "explanation": f"Average hip-level deviation was {posture}, indicating lateral posture variation in the available pose data.", "recommended_action": "Use trunk-control and hip-stability drills; review technique before increasing load."})
        if flexion > 170:
            findings.append({"anomaly_type": "limited_knee_range_of_motion", "severity": "Moderate", "frame_index": None, "body_region": "knees", "explanation": f"Minimum derived knee flexion was {flexion} degrees, suggesting limited observed flexion in this recording.", "recommended_action": "Assess movement depth and mobility with a qualified practitioner; do not force range through pain."})
        if velocity > 12:
            findings.append({"anomaly_type": "motion_inconsistency", "severity": "Moderate", "frame_index": None, "body_region": "knees", "explanation": f"Frame-to-frame knee-angle change averaged {velocity} degrees, above the consistency review threshold.", "recommended_action": "Slow the movement, use controlled repetitions, and reassess fatigue and recording quality."})
        return findings

    @staticmethod
    def _component_scores(db: Session, athlete_id: int, metrics: Dict[str, Any]) -> tuple[Dict[str, float], Dict[str, Any], List[str]]:
        acwr = OvertrainingRiskAnalytics.calculate_acwr(db, athlete_id)
        factors: List[str] = []
        posture = float(metrics.get("posture_deviation_score", 0))
        symmetry = float(metrics.get("symmetry_index", 100))
        flexion = float(metrics.get("max_flexion_angle", 180))
        biomech = clamp((posture * 2.5) + max(0, flexion - 150) * 0.8)
        if posture > 15: factors.append(f"Posture deviation ({posture}) raised biomechanical risk.")
        if flexion > 170: factors.append(f"Observed knee range metric ({flexion}°) indicated a movement review.")
        asymmetry = clamp((100 - symmetry) * 5)
        if symmetry < 92: factors.append(f"Bilateral symmetry was {symmetry}%.")
        injuries = db.query(models.InjuryHistory).filter(models.InjuryHistory.athlete_id == athlete_id).all()
        unresolved = [inj for inj in injuries if inj.status in ("active", "rehab")]
        injury_score = clamp(sum(80 if i.severity.lower() == "high" else 55 if i.severity.lower() == "medium" else 25 for i in unresolved) / max(len(unresolved), 1) if unresolved else min(len(injuries) * 10, 30))
        if unresolved: factors.append(f"{len(unresolved)} active or rehabilitation injury record(s) influenced historical risk.")
        acwr_value = float(acwr["acwr"])
        training = 0.0 if 0.8 <= acwr_value <= 1.3 else 40.0 if 1.3 < acwr_value <= 1.5 or 0.5 <= acwr_value < 0.8 else 80.0
        if training: factors.append(f"ACWR was {acwr_value} ({acwr['status']}).")
        recent_logs = db.query(models.TrainingLoad).filter(models.TrainingLoad.athlete_id == athlete_id, models.TrainingLoad.date >= datetime.date.today() - datetime.timedelta(days=7)).all()
        mean_rpe = sum(x.rpe for x in recent_logs) / len(recent_logs) if recent_logs else 0
        fatigue = clamp((mean_rpe - 5) * 15 + (35 if acwr_value > 1.5 else 0) + (20 if symmetry < 85 else 0))
        if fatigue > 25: factors.append(f"Recent mean RPE was {round(mean_rpe, 1)}/10 with workload/movement fatigue flags.")
        return {"biomechanical_deviations": biomech, "historical_injury_factors": injury_score, "movement_asymmetry": asymmetry, "training_load_indicators": training, "fatigue_indicators": fatigue}, acwr, factors

    @staticmethod
    def build_assessment(db: Session, athlete_id: int, persist: bool = True, video: Optional[models.Video] = None) -> models.IntelligenceAssessment:
        if not video:
            video, metrics = AthleteIntelligenceService.latest_biomechanics(db, athlete_id)
        else:
            metrics = BiomechanicalAnalytics.analyze_skeletal_data(video.skeletal_data) if video.skeletal_data else AthleteIntelligenceService.latest_biomechanics(db, athlete_id)[1]
        components, acwr, factors = AthleteIntelligenceService._component_scores(db, athlete_id, metrics)
        weighted = {name: {"weight_pct": weight, "raw_risk_score": components[name], "weighted_contribution": round(components[name] * weight / 100, 1)} for name, weight in WEIGHTS.items()}
        injury_score = clamp(sum(item["weighted_contribution"] for item in weighted.values()))
        anomalies = AthleteIntelligenceService.detect_anomalies(metrics, video.id if video else None)
        if anomalies: factors.extend(x["explanation"] for x in anomalies)
        quality = clamp(100 - (components["biomechanical_deviations"] * .55 + components["movement_asymmetry"] * .45))
        efficiency = clamp(100 - (components["biomechanical_deviations"] * .65 + components["movement_asymmetry"] * .35))
        fatigue = components["fatigue_indicators"]
        health = clamp(100 - (injury_score * .55 + fatigue * .2 + components["historical_injury_factors"] * .1))
        predictions = AthleteIntelligenceService._risk_predictions(injury_score, components, metrics, acwr)
        assessment = models.IntelligenceAssessment(
            athlete_id=athlete_id, video_id=video.id if video else None, injury_risk_score=injury_score,
            risk_category=severity_for(injury_score), risk_probability=injury_score,
            movement_quality_score=quality, biomechanical_efficiency_score=efficiency,
            fatigue_risk_score=fatigue, health_score=health,
            scoring_breakdown=json.dumps({"weights": WEIGHTS, "components": weighted, "metrics": metrics, "acwr": acwr}),
            risk_predictions=json.dumps(predictions), explanation=" ".join(factors) if factors else "No available data crossed an analytical review threshold.",
        )
        if persist:
            db.add(assessment); db.flush()
            for anomaly in anomalies:
                db.add(models.MovementAnomaly(athlete_id=athlete_id, video_id=video.id if video else None, assessment_id=assessment.id, **anomaly))
            for rec in AthleteIntelligenceService.recommendations(components, anomalies):
                db.add(models.Recommendation(athlete_id=athlete_id, assessment_id=assessment.id, **rec))
            db.commit(); db.refresh(assessment)
        return assessment

    @staticmethod
    def _risk_predictions(overall: float, components: Dict[str, float], metrics: Dict[str, Any], acwr: Dict[str, Any]) -> List[Dict[str, Any]]:
        posture, asymmetry, fatigue = components["biomechanical_deviations"], components["movement_asymmetry"], components["fatigue_indicators"]
        values = [
            ("ACL injury risk", clamp(overall * .45 + asymmetry * .45 + posture * .2), ["knee symmetry", "posture deviation"]),
            ("Hamstring injury risk", clamp(overall * .35 + fatigue * .45 + components["training_load_indicators"] * .2), ["fatigue indicators", "training load"]),
            ("Ankle sprain risk", clamp(overall * .3 + asymmetry * .55), ["movement asymmetry"]),
            ("Shoulder injury risk", clamp(overall * .2 + posture * .45), ["trunk/posture deviation"]),
            ("Lower-back injury risk", clamp(overall * .3 + posture * .6), ["posture deviation"]),
            ("Overuse injury risk", clamp(overall * .35 + components["training_load_indicators"] * .45 + fatigue * .25), ["ACWR", "fatigue"]),
        ]
        return [{"category": name, "risk_probability": score, "severity": severity_for(score), "contributing_factors": source, "explanation": f"Rule-based analytical estimate derived from currently available {', '.join(source)} data."} for name, score, source in values]

    @staticmethod
    def recommendations(components: Dict[str, float], anomalies: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        recs: List[Dict[str, str]] = []
        if components["movement_asymmetry"] >= 25:
            recs.append({"category": "technique", "priority": "High", "recommendation": "Add supervised single-leg control and landing-mechanics drills.", "rationale": "Generated because the available pose analysis found left/right asymmetry."})
        if components["biomechanical_deviations"] >= 25:
            recs.append({"category": "mobility_strength", "priority": "High", "recommendation": "Use hip/glute strengthening and trunk-control work before increasing intensity.", "rationale": "Generated from posture or range-of-motion deviations in the recorded movement."})
        if components["training_load_indicators"] >= 40:
            recs.append({"category": "load_management", "priority": "High", "recommendation": "Reduce or hold training progression and review the next 7-day workload.", "rationale": "Generated because ACWR is outside the target 0.8–1.3 range."})
        if components["fatigue_indicators"] >= 25:
            recs.append({"category": "recovery", "priority": "Moderate", "recommendation": "Schedule a recovery-focused day, sleep review, and lower-RPE session before another high-intensity block.", "rationale": "Generated from recent RPE and workload/movement fatigue indicators."})
        if not recs:
            recs.append({"category": "maintenance", "priority": "Low", "recommendation": "Maintain progressive loading, dynamic warm-up, and routine technique review.", "rationale": "No available analytical component exceeded a review threshold."})
        return recs

    @staticmethod
    def serialize(db: Session, assessment: models.IntelligenceAssessment) -> Dict[str, Any]:
        anomalies = db.query(models.MovementAnomaly).filter(models.MovementAnomaly.assessment_id == assessment.id).all()
        recs = db.query(models.Recommendation).filter(models.Recommendation.assessment_id == assessment.id).all()
        data = {key: getattr(assessment, key) for key in ("id", "athlete_id", "video_id", "assessed_at", "injury_risk_score", "risk_category", "risk_probability", "movement_quality_score", "biomechanical_efficiency_score", "fatigue_risk_score", "health_score", "explanation")}
        data.update(scoring_breakdown=json.loads(assessment.scoring_breakdown), risk_predictions=json.loads(assessment.risk_predictions), anomalies=anomalies, recommendations=recs, analytical_disclaimer=DISCLAIMER)
        return data
