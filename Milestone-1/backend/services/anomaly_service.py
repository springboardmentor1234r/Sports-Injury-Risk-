def detect_anomalies(joint_angles):
    """
    Detect movement anomalies based on joint angles.
    """

    knee = joint_angles.get("left_knee", 180)
    hip = joint_angles.get("left_hip", 180)
    elbow = joint_angles.get("left_elbow", 180)

    anomalies = []

    # Knee analysis
    if knee < 130:
        anomalies.append({
            "joint": "Left Knee",
            "severity": "High",
            "issue": "Excessive knee flexion",
            "recommendation": "Reduce knee bending during movement."
        })
    elif knee < 150:
        anomalies.append({
            "joint": "Left Knee",
            "severity": "Medium",
            "issue": "Moderate knee flexion",
            "recommendation": "Maintain better knee alignment."
        })

    # Hip analysis
    if hip < 135:
        anomalies.append({
            "joint": "Left Hip",
            "severity": "High",
            "issue": "Hip instability",
            "recommendation": "Strengthen hip stabilizer muscles."
        })
    elif hip < 155:
        anomalies.append({
            "joint": "Left Hip",
            "severity": "Medium",
            "issue": "Reduced hip extension",
            "recommendation": "Improve hip mobility and flexibility."
        })

    # Elbow analysis
    if elbow < 135:
        anomalies.append({
            "joint": "Left Elbow",
            "severity": "High",
            "issue": "Excessive elbow flexion",
            "recommendation": "Maintain proper arm posture."
        })
    elif elbow < 160:
        anomalies.append({
            "joint": "Left Elbow",
            "severity": "Low",
            "issue": "Slight elbow flexion",
            "recommendation": "Relax arm movement."
        })

    if not anomalies:
        anomalies.append({
            "joint": "Overall",
            "severity": "None",
            "issue": "No significant movement anomalies detected",
            "recommendation": "Maintain current movement pattern."
        })

    return anomalies