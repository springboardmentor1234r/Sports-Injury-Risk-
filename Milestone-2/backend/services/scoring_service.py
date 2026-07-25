def calculate_risk_score(predictions, anomalies):
    """
    Calculate an overall movement score and risk level.
    """

    score = 100

    # Deduct points based on injury predictions
    for risk in predictions.values():
        if risk == "Medium":
            score -= 10
        elif risk == "High":
            score -= 20

    # Deduct points based on anomalies
    for anomaly in anomalies:
        severity = anomaly.get("severity")

        if severity == "Low":
            score -= 5
        elif severity == "Medium":
            score -= 10
        elif severity == "High":
            score -= 20

    score = max(score, 0)

    if score >= 85:
        level = "Low"
    elif score >= 65:
        level = "Moderate"
    else:
        level = "High"

    return {
        "overall_score": score,
        "risk_level": level
    }