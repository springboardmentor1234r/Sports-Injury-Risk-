def evaluate_movement_quality(angles):

    score = 100

    left_knee = angles.get("Left Knee", 180)
    right_knee = angles.get("Right Knee", 180)

    left_elbow = angles.get("Left Elbow", 180)
    right_elbow = angles.get("Right Elbow", 180)

    # Knee symmetry
    if abs(left_knee - right_knee) > 15:
        score -= 20

    # Elbow symmetry
    if abs(left_elbow - right_elbow) > 20:
        score -= 10

    # Excessive knee bending
    if left_knee < 90 or right_knee < 90:
        score -= 20

    # Slight knee bending
    elif left_knee < 140 or right_knee < 140:
        score -= 10

    if score >= 90:
        quality = "Excellent"

    elif score >= 75:
        quality = "Good"

    elif score >= 60:
        quality = "Fair"

    else:
        quality = "Poor"

    return score, quality