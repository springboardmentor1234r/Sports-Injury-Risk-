def detect_running_phase(angles):
    left_knee=angles.get("Left Knee",180)
    right_knee=angles.get("Right Knee",180)

    if left_knee<100 and right_knee>150:
        return "Swing Phase"

    elif right_knee<100 and left_knee>150:
        return "Swing Phase"
    elif left_knee>155 and right_knee>155:
        return "Stance Phase"
    elif left_knee>120 and right_knee<120:
        return "Landing Phase"
    return "Push-Off Phase"