from typing import Dict, List

class RecommendationEngine:
    @staticmethod
    def generate_recommendations(predictions: Dict[str, Dict], anomalies: List[Dict], athlete_profile: Dict) -> List[Dict]:
        """
        Generates automated recommendations across 5 categories:
        1. Exercise Recommendations (Corrective)
        2. Mobility Improvement Suggestions
        3. Strengthening Recommendations
        4. Recovery Planning
        5. Training Modification Suggestions
        """
        recs = []
        sport = athlete_profile.get("sport_type", "Soccer")

        # Check ACL & Knee Valgus risk
        acl_info = predictions.get("ACL Injury Risk", {})
        if acl_info.get("score", 0) > 35 or any("Knee Valgus" in a.get("title", "") for a in anomalies):
            recs.append({
                "id": "REC-ACL-01",
                "title": "Banded Glute Abduction & Drop Jump Mechanics",
                "category": "Exercise Recommendation",
                "exercise_type": "Corrective",
                "priority": "Critical" if acl_info.get("score", 0) > 50 else "High",
                "body_region": "Knee & Glutes",
                "description": "Perform 3 sets of 12 reps of resisted monster walks and single-leg soft landings to prevent inward knee rotation collapse.",
                "duration": "15 mins",
                "frequency": "3x / week"
            })

        # Check Hamstring & Asymmetry risk
        hamstring_info = predictions.get("Hamstring Injury Risk", {})
        if hamstring_info.get("score", 0) > 35 or any("Asymmetry" in a.get("title", "") for a in anomalies):
            recs.append({
                "id": "REC-HAM-02",
                "title": "Eccentric Nordic Hamstring Curls",
                "category": "Strengthening Recommendation",
                "exercise_type": "Strength",
                "priority": "High",
                "body_region": "Posterior Chain",
                "description": "Execute 4 sets of 6 reps of slow eccentric Nordic drops to increase hamstring fascicle length and absorb high-speed sprint loads.",
                "duration": "12 mins",
                "frequency": "2x / week"
            })

        # Check Ankle Sprain & Balance risk
        ankle_info = predictions.get("Ankle Sprain Risk", {})
        if ankle_info.get("score", 0) > 30 or any("Sway" in a.get("title", "") for a in anomalies):
            recs.append({
                "id": "REC-ANK-03",
                "title": "Bosu Ball Single-Leg Stability & Calf Wall Stretch",
                "category": "Mobility Suggestion",
                "exercise_type": "Mobility",
                "priority": "Medium",
                "body_region": "Ankle & Calf",
                "description": "Perform 30-second single-leg balance holds on unstable surfaces combined with dorsiflexion mobility stretches.",
                "duration": "10 mins",
                "frequency": "Daily"
            })

        # Check Lower Back & Trunk Lean risk
        back_info = predictions.get("Lower Back Injury Risk", {})
        if back_info.get("score", 0) > 35 or any("Trunk" in a.get("title", "") for a in anomalies):
            recs.append({
                "id": "REC-BAC-04",
                "title": "Anti-Rotational Pallof Press & Deadbug Core Stabilizers",
                "category": "Exercise Recommendation",
                "exercise_type": "Corrective",
                "priority": "High",
                "body_region": "Core & Lumbar",
                "description": "3 sets of 10 reps per side. Strengthen deep core local stabilizers to eliminate compensatory lumbar spinal sway.",
                "duration": "15 mins",
                "frequency": "3x / week"
            })

        # Recovery & Training Modifications based on Overuse risk
        overuse_info = predictions.get("Overuse Injury Risk", {})
        if overuse_info.get("score", 0) > 40:
            recs.append({
                "id": "REC-REC-05",
                "title": "Deload Phase & Active Contrast Hydrotherapy",
                "category": "Recovery Planning",
                "exercise_type": "Recovery",
                "priority": "High",
                "body_region": "Full Body",
                "description": "Reduce high-impact training volume by 25% for 7 days. Integrate 15-minute contrast bath protocols after heavy sessions.",
                "duration": "20 mins",
                "frequency": "Post-Training"
            })
            recs.append({
                "id": "REC-MOD-06",
                "title": f"Sport-Specific Drill Modification ({sport})",
                "category": "Training Modification",
                "exercise_type": "Training Mod",
                "priority": "Medium",
                "body_region": "Neuromuscular",
                "description": f"Cap maximum velocity sprint repetitions at 8 per session. Substitute maximum jump reps with low-impact pool plyometrics.",
                "duration": "N/A",
                "frequency": "Weekly Adjust"
            })

        # Default general maintenance rec if low risk
        if not recs:
            recs.append({
                "id": "REC-GEN-00",
                "title": "General Dynamic Warm-Up & Mobility Maintenance",
                "category": "Mobility Suggestion",
                "exercise_type": "Mobility",
                "priority": "Low",
                "body_region": "Full Body",
                "description": "Continue standard dynamic athletic warm-ups prior to all high-intensity practices.",
                "duration": "10 mins",
                "frequency": "Daily"
            })

        return recs
