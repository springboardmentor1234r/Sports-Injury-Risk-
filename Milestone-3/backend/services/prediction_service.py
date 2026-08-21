def predict_injury_risk(joint_angles):
    """
    Predict injury risks using rule-based biomechanical analysis.
    """

    knee = joint_angles.get("left_knee", 180)
    hip = joint_angles.get("left_hip", 180)
    elbow = joint_angles.get("left_elbow", 180)

    risks = {
        "acl_risk": "Low",
        "hamstring_risk": "Low",
        "ankle_sprain_risk": "Low",
        "shoulder_risk": "Low",
        "lower_back_risk": "Low"
    }

    # ACL Risk
    if knee < 150:
        risks["acl_risk"] = "Medium"

    if knee < 130:
        risks["acl_risk"] = "High"

    # Hamstring Risk
    if hip < 155:
        risks["hamstring_risk"] = "Medium"

    if hip < 135:
        risks["hamstring_risk"] = "High"

    # Ankle Sprain Risk
    if knee < 145:
        risks["ankle_sprain_risk"] = "Medium"

    if knee < 120:
        risks["ankle_sprain_risk"] = "High"

    # Shoulder Risk
    if elbow < 160:
        risks["shoulder_risk"] = "Medium"

    if elbow < 135:
        risks["shoulder_risk"] = "High"

    # Lower Back Risk
    if hip < 150:
        risks["lower_back_risk"] = "Medium"

    if hip < 125:
        risks["lower_back_risk"] = "High"

    return risks