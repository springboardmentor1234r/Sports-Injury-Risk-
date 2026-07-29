def calculate_risk(
    left_elbow,
    right_elbow,
    left_knee,
    right_knee,
    left_hip,
    right_hip
):

    score = 0
    remarks = []

    if left_knee < 120:
        score += 25
        remarks.append("Left knee angle is abnormal.")

    if right_knee < 120:
        score += 25
        remarks.append("Right knee angle is abnormal.")

    if left_hip < 110:
        score += 20
        remarks.append("Left hip posture needs attention.")

    if right_hip < 110:
        score += 20
        remarks.append("Right hip posture needs attention.")

    if left_elbow < 70:
        score += 15
        remarks.append("Left elbow movement is restricted.")

    if right_elbow < 70:
        score += 15
        remarks.append("Right elbow movement is restricted.")

    score = min(score, 100)

    if score < 25:
        level = "Low"

    elif score < 60:
        level = "Medium"

    else:
        level = "High"

    if not remarks:
        remarks.append("Movement appears normal.")

    return {
        "risk_score": score,
        "risk_level": level,
        "remarks": remarks
    }
