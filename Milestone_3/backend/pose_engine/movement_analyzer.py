def detect_issues(right_knee, left_knee,
                  right_elbow, left_elbow,
                  right_hip, left_hip):

    issues = []

    if right_knee < 140:
        issues.append("Right Knee Over Flexion")

    if left_knee < 140:
        issues.append("Left Knee Over Flexion")

    if right_elbow < 140:
        issues.append("Right Elbow Over Flexion")

    if left_elbow < 140:
        issues.append("Left Elbow Over Flexion")

    if right_hip < 140:
        issues.append("Right Hip Instability")

    if left_hip < 140:
        issues.append("Left Hip Instability")

    if len(issues) == 0:
        issues.append("No major movement issues detected")

    return issues