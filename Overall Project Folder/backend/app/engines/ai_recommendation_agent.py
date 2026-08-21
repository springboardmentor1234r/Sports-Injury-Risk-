import uuid
from typing import Dict, List, Any

class AIRecommendationAgent:
    def generate_recommendations(
        self,
        athlete_id: str,
        analysis_id: str,
        biomechanics: Dict[str, Any],
        predictions: Dict[str, float],
        risk_scoring: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Generates tailored, actionable AI recommendations based on detected movement flaws.
        """
        recommendations = []

        knee_valgus = biomechanics.get("knee_valgus", "Normal")
        symmetry = biomechanics.get("movement_symmetry", 85.0)
        trunk_lean = biomechanics.get("trunk_lean", 10.0)
        acl_risk = predictions.get("acl_risk", 20.0)
        hamstring_risk = predictions.get("hamstring_risk", 20.0)
        overuse_risk = predictions.get("overuse_risk", 20.0)
        overall_risk = risk_scoring.get("overall_risk_score", 30.0)

        # 1. Knee Valgus / ACL Risk -> Corrective Exercises & Strengthening
        if knee_valgus in ["Mild Valgus", "Moderate Valgus", "Severe"] or acl_risk > 30.0:
            prio = "High" if acl_risk > 45.0 else "Medium"
            recommendations.append({
                "id": str(uuid.uuid4()),
                "athlete_id": athlete_id,
                "analysis_id": analysis_id,
                "category": "Corrective Exercises",
                "title": "Single-Leg Glute Medius & Knee Alignment Drills",
                "description": "Perform single-leg squat taps with a resistance band around lower thighs to prevent inward knee collapse (valgus deviation).",
                "priority": prio,
                "target_area": "Gluteus Medius & Knee Complex",
                "frequency": "3 sets x 12 reps (4x per week)",
                "reason": f"Detected {knee_valgus} and elevated ACL risk ({acl_risk}%).",
                "status": "Pending"
            })

        # 2. Movement Asymmetry -> Strengthening & Single-Leg Balance
        if symmetry < 82.0:
            recommendations.append({
                "id": str(uuid.uuid4()),
                "athlete_id": athlete_id,
                "analysis_id": analysis_id,
                "category": "Strengthening",
                "title": "Unilateral Lower Body Strength Protocol",
                "description": "Incorporate single-leg Romanian deadlifts and Bulgarian split squats focusing on equal depth and hip stability.",
                "priority": "High" if symmetry < 75.0 else "Medium",
                "target_area": "Hamstrings, Quadriceps & Hips",
                "frequency": "3 sets x 10 reps per leg (3x per week)",
                "reason": f"Left/Right movement symmetry score is lower than threshold ({symmetry}%).",
                "status": "Pending"
            })

        # 3. Excessive Trunk Lean -> Mobility & Core Stability
        if trunk_lean > 14.0:
            recommendations.append({
                "id": str(uuid.uuid4()),
                "athlete_id": athlete_id,
                "analysis_id": analysis_id,
                "category": "Mobility",
                "title": "Hip Ankle Mobility & Anti-Extension Core Training",
                "description": "Perform dynamic ankle dorsiflexion stretches and deadbug anti-extension core holds to reduce forward trunk compensation.",
                "priority": "Medium",
                "target_area": "Thoracolumbar Core & Ankle Joint",
                "frequency": "15 minutes daily before practice",
                "reason": f"Excessive forward trunk lean angle ({trunk_lean}°) detected during movement.",
                "status": "Pending"
            })

        # 4. High Overuse / Fatigue Risk -> Training Modification & Recovery
        if overuse_risk > 35.0 or overall_risk > 45.0:
            recommendations.append({
                "id": str(uuid.uuid4()),
                "athlete_id": athlete_id,
                "analysis_id": analysis_id,
                "category": "Training Modification",
                "title": "Impact Volume Reduction & Deload Protocol",
                "description": "Limit high-impact plyometric jumping and maximum sprint volume by 30% for the next 7 days.",
                "priority": "High" if overall_risk > 60.0 else "Medium",
                "target_area": "Overall Musculoskeletal System",
                "frequency": "Immediate modification for 7 days",
                "reason": f"Overuse injury risk elevated at {overuse_risk}% with overall risk score {overall_risk}.",
                "status": "Pending"
            })

        # 5. General Recovery Recommendation
        recommendations.append({
            "id": str(uuid.uuid4()),
            "athlete_id": athlete_id,
            "analysis_id": analysis_id,
            "category": "Recovery",
            "title": "Active Post-Session Myofascial Release & Contrast Bath",
            "description": "Spend 10 minutes foam rolling calves, hamstrings, and IT bands followed by active mobility work.",
            "priority": "Low",
            "target_area": "Lower Limb Kinetic Chain",
            "frequency": "Daily post-workout",
            "reason": "Standard recovery recommendation to improve tissue compliance and speed fatigue recovery.",
            "status": "Pending"
        })

        return recommendations

ai_recommendation_agent = AIRecommendationAgent()
