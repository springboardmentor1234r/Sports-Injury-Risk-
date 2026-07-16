def calculate_risk_score(angles):

    score = 0

    left_knee = angles["Left Knee"]
    right_knee = angles["Right Knee"]

    if left_knee < 90:
        score += 30

    if right_knee < 90:
        score += 30

    if left_knee < 60:
        score += 20

    if right_knee < 60:
        score += 20

    score = min(score, 100)

    if score < 30:
        status = "SAFE"
    elif score < 60:
        status = "MEDIUM RISK"
    else:
        status = "HIGH RISK"

    return score, status