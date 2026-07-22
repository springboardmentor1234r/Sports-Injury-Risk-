def generate_recommendations(predictions, anomalies):
    """
    Generate personalized corrective recommendations.
    """

    recommendations = []

    # Recommendations based on injury predictions
    if predictions["acl_risk"] != "Low":
        recommendations.append(
            "Perform ACL injury prevention exercises and strengthen the quadriceps and hamstrings."
        )

    if predictions["hamstring_risk"] != "Low":
        recommendations.append(
            "Include hamstring stretching and eccentric strengthening exercises."
        )

    if predictions["ankle_sprain_risk"] != "Low":
        recommendations.append(
            "Practice ankle stability and balance training."
        )

    if predictions["shoulder_risk"] != "Low":
        recommendations.append(
            "Improve shoulder mobility and rotator cuff strength."
        )

    if predictions["lower_back_risk"] != "Low":
        recommendations.append(
            "Strengthen the core and maintain a neutral spine posture."
        )

    # Recommendations from detected anomalies
    for anomaly in anomalies:
        issue = anomaly.get("issue", "")

        if issue != "No significant movement anomalies detected":
            recommendations.append(anomaly["recommendation"])

    # Default recommendation
    if not recommendations:
        recommendations.append(
            "Excellent movement pattern. Continue your current training routine and maintain proper warm-up and stretching."
        )

    return recommendations