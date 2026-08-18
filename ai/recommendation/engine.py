"""
Recommendation Engine for Injury Prevention and Rehabilitation.
"""
from typing import List, Dict

def generate_recommendations(risk_prediction: Dict[str, float], biomechanics_data: Dict) -> List[str]:
    """
    Generate actionable recommendations based on biomechanical analysis and risk prediction.
    """
    recs = []
    
    # Check overall risk
    critical_risk = risk_prediction.get("CRITICAL", 0)
    high_risk = risk_prediction.get("HIGH", 0)
    
    if critical_risk > 0.5:
        recs.append("CRITICAL: Immediate rest recommended. Consult a physiotherapist or sports doctor.")
    elif high_risk > 0.4:
        recs.append("HIGH RISK: Modify training load. Focus on recovery and form correction.")
        
    # Specific biomechanical flags
    landing = biomechanics_data.get("landing", {})
    if landing.get("left_valgus", 0) > 15 or landing.get("right_valgus", 0) > 15:
        recs.append("Knee Valgus Detected: Incorporate glute bridge and lateral band walks to strengthen hip abductors.")
        recs.append("Landing Mechanics: Practice soft landings, keeping knees aligned with toes.")
        
    if not recs:
        recs.append("Movement patterns look solid. Continue current training program.")
        
    return recs
