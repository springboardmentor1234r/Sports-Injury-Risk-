def assess_risk(joint_angles):
    """
    Simple rule-based injury risk assessment.
    """

    if not joint_angles:
        return {
            "movement_quality": "Unknown",
            "injury_risk": "Unknown"
        }

    knee = joint_angles.get("left_knee", 180)
    hip = joint_angles.get("left_hip", 180)
    elbow = joint_angles.get("left_elbow", 180)

    risk = "Low"
    quality = "Good"

    if knee < 140 or hip < 140:
        risk = "Medium"
        quality = "Needs Improvement"

    if knee < 110 or hip < 110:
        risk = "High"
        quality = "Poor"

    return {
        "movement_quality": quality,
        "injury_risk": risk
    }