def analyze_symmetry(angles):

    report = {}

    # Compare knees
    left_knee = angles.get("Left Knee", 180)
    right_knee = angles.get("Right Knee", 180)

    knee_difference = abs(left_knee - right_knee)

    report["Knee Difference"] = round(knee_difference, 1)

    if knee_difference <= 10:
        report["Knee Status"] = "Balanced"
    elif knee_difference <= 20:
        report["Knee Status"] = "Slight Imbalance"
    else:
        report["Knee Status"] = "High Imbalance"

    # Compare elbows
    left_elbow = angles.get("Left Elbow", 180)
    right_elbow = angles.get("Right Elbow", 180)

    elbow_difference = abs(left_elbow - right_elbow)

    report["Elbow Difference"] = round(elbow_difference, 1)

    if elbow_difference <= 10:
        report["Elbow Status"] = "Balanced"
    elif elbow_difference <= 20:
        report["Elbow Status"] = "Slight Imbalance"
    else:
        report["Elbow Status"] = "High Imbalance"

    return report