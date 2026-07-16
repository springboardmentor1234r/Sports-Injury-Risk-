def detect_injury_risk(angles):

    risk = []

    knee = angles.get("Left Knee")

    if knee is not None:

        if knee < 90:
            risk.append("[HIGH] High Knee Injury Risk")

        elif knee < 140:
            risk.append("[MEDIUM] Moderate Knee Risk")

        else:
            risk.append("[SAFE] Knee is Safe")

    elbow = angles.get("Left Elbow")

    if elbow is not None:

        if elbow < 60:
            risk.append("[MEDIUM] Elbow Fully Bent")

    return risk