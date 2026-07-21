def generate_recommendations(
    angles,
    risk_score,
    movement_quality,
    symmetry,
    running_phase
):

    recommendations = []

    if risk_score >= 70:
        recommendations.append(
            "High injury risk. Reduce training intensity."
        )

    elif risk_score >= 40:
        recommendations.append(
            "Moderate injury risk. Monitor movement closely."
        )

    else:
        recommendations.append(
            "Low injury risk. Continue current training."
        )

    if movement_quality == "Poor":
        recommendations.append(
            "Improve running posture."
        )

    elif movement_quality == "Average":
        recommendations.append(
            "Focus on movement efficiency."
        )

    if symmetry["Knee Status"] != "Balanced":
        recommendations.append(
            "Improve lower-limb balance."
        )

    if symmetry["Elbow Status"] != "Balanced":
        recommendations.append(
            "Improve upper-body coordination."
        )

    if running_phase == "Landing Phase":
        recommendations.append(
            "Practice softer landings."
        )

    if angles["Left Knee"] < 100 or angles["Right Knee"] < 100:
        recommendations.append(
            "Increase knee mobility."
        )

    return recommendations