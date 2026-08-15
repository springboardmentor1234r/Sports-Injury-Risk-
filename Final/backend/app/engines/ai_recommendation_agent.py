import os
import json
import logging
import urllib.request
from typing import Dict, List, Any

logger = logging.getLogger("sird.ai_agent")

class AIRecommendationAgent:
    """
    Autonomous Generative AI Agent for Sports Biomechanics & Injury Prevention.
    Generates personalized clinical exercise prescriptions based on an athlete's 3D keypoints,
    biomechanical metrics, injury history, and ML risk scores.
    Falls back seamlessly to local Kinematic AI Expert System if external LLM API is unavailable.
    """

    @classmethod
    def generate_ai_recommendations(
        cls, 
        athlete_profile: Dict[str, Any], 
        biomechanical_metrics: Dict[str, Any], 
        injury_predictions: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        
        # 1. Attempt Generative AI Agent execution via LLM (e.g. Gemini / OpenAI API)
        from app.config import settings
        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY") or os.environ.get("OPENAI_API_KEY")
        
        if api_key:
            try:
                llm_recs = cls._call_llm_agent(api_key, athlete_profile, biomechanical_metrics, injury_predictions)
                if llm_recs and len(llm_recs) > 0:
                    logger.info("Successfully generated personalized recommendations using Generative AI Agent!")
                    return llm_recs
            except Exception as e:
                logger.warning(f"LLM Agent call failed ({e}). Falling back to local Kinematic AI System.")

        # 2. Fallback Mechanism: Kinematic AI Expert System
        return cls._generate_kinematic_fallback_recommendations(athlete_profile, biomechanical_metrics, injury_predictions)

    @classmethod
    def _call_llm_agent(cls, api_key: str, profile: dict, metrics: dict, predictions: dict) -> List[dict]:
        prompt = f"""
        Act as an elite Sports Biomechanics & Physical Therapy AI Agent.
        Analyze the following athlete data and return a JSON list of 3-4 personalized corrective exercise recommendations:

        Athlete: {profile.get('sport_type')} player, Position: {profile.get('position')}, Age: {profile.get('age')}, Injury History: {profile.get('injury_history')}
        Biomechanical Metrics:
        - Knee Valgus: {metrics.get('knee_valgus_deg')}° (Optimal < 8.0°)
        - Hip Stability: {metrics.get('hip_stability')}
        - Trunk Lean: {metrics.get('trunk_lean_deg')}° (Optimal < 10.0°)
        - Landing Flexion: {metrics.get('landing_flexion_deg')}°
        - Movement Asymmetry: {metrics.get('asymmetry_ratio')}%

        Predicted ML Injury Risks: {json.dumps(predictions)}

        Return ONLY a raw JSON array of objects with keys: "title", "category", "priority", "body_region", "frequency", "description".
        """
        
        # Candidate Gemini models (including active 3.7 video understanding & 2.5 flash models)
        models = [
            "gemini-3.7-flash-video-understanding-eap",
            "gemini-2.5-computer-use-preview-10-2025",
            "gemini-robotics-er-2-preview",
            "gemini-2.5-flash",
            "gemini-1.5-flash-latest"
        ]
        
        for model_name in models:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
                req_data = {
                    "contents": [{"parts": [{"text": prompt}]}]
                }
                req = urllib.request.Request(
                    url,
                    data=json.dumps(req_data).encode('utf-8'),
                    headers={'Content-Type': 'application/json'}
                )
                with urllib.request.urlopen(req, timeout=10) as response:
                    res_json = json.loads(response.read().decode('utf-8'))
                    text_out = res_json['candidates'][0]['content']['parts'][0]['text']
                    clean_text = text_out.replace("```json", "").replace("```", "").strip()
                    parsed = json.loads(clean_text)
                    if isinstance(parsed, list) and len(parsed) > 0:
                        logger.info(f"Successfully generated recommendations via Gemini model: {model_name}")
                        return parsed
            except Exception as err:
                logger.debug(f"Gemini model {model_name} attempt error: {err}")
                continue

        return []



    @classmethod
    def _generate_kinematic_fallback_recommendations(cls, profile: dict, metrics: dict, predictions: dict) -> List[dict]:
        recs = []
        
        knee_valgus = metrics.get('knee_valgus_deg', 8.5)
        landing_flex = metrics.get('landing_flexion_deg', 30.0)
        asym = metrics.get('asymmetry_ratio', 18.5)
        trunk_lean = metrics.get('trunk_lean_deg', 14.2)
        load_hrs = profile.get('training_load', 14)

        if knee_valgus > 10.0:
            recs.append({
                "title": "VMO & Gluteus Medius Activation Protocol",
                "category": "Neuromuscular Control",
                "priority": "High",
                "body_region": "Knee Joint & Hip Abductors",
                "frequency": "3x / week (3 sets of 15 reps)",
                "description": f"AI Kinematic Agent Flag: Dynamic knee valgus observed at {knee_valgus:.1f}°. Implement banded monster walks and single-leg deceleration holds to stabilize patellofemoral tracking."
            })

        if landing_flex < 35.0:
            recs.append({
                "title": "Soft-Landing Plyometric Shock Absorption",
                "category": "Landing Mechanics",
                "priority": "High",
                "body_region": "Quadriceps & Hamstrings",
                "frequency": "2x / week (4 sets of 8 jumps)",
                "description": f"AI Kinematic Agent Flag: Stiff ground landing detected at {landing_flex:.1f}° knee flexion. Perform box depth drop-and-holds focusing on deep 60° knee flexion."
            })

        if asym > 15.0:
            recs.append({
                "title": "Unilateral Isokinetic Asymmetry Equalization",
                "category": "Bilateral Balance",
                "priority": "High",
                "body_region": "Lower Limb Kinetic Chain",
                "frequency": "3x / week",
                "description": f"AI Kinematic Agent Flag: Unilateral force asymmetry of {asym:.1f}% detected. Execute Bulgarian split squats and single-leg RDLs to balance bilateral ground reaction force."
            })

        if trunk_lean > 12.0:
            recs.append({
                "title": "Anti-Rotational Core & Lumbar Stabilization",
                "category": "Core Stability",
                "priority": "Medium",
                "body_region": "Trunk & Lumbar Spine",
                "frequency": "Daily Warmup",
                "description": f"AI Kinematic Agent Flag: Lateral trunk lean of {trunk_lean:.1f}°. Perform Pallof presses and side planks to eliminate lateral spinal shear forces."
            })

        if len(recs) == 0:
            recs.append({
                "title": "Full-Body Athletic Maintenance Routine",
                "category": "General Recovery",
                "priority": "Low",
                "body_region": "Full Body",
                "frequency": "Daily",
                "description": "Optimal kinematic alignment detected. Maintain current dynamic mobility and recovery routines."
            })

        return recs
