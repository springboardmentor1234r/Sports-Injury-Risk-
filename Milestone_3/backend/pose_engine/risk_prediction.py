def predict_risk(right_knee, left_knee,
                 right_elbow, left_elbow,
                 right_hip, left_hip):

    score = 0

    issues = []
    exercises = []

    # Right Knee
    if right_knee < 90:
        score += 30
        issues.append("Right Knee Over Flexion")
        exercises.append("Practice Quadriceps Strengthening")
    elif right_knee < 140:
        score += 15

    # Left Knee
    if left_knee < 90:
        score += 30
        issues.append("Left Knee Over Flexion")
        exercises.append("Practice Hamstring Stretching")
    elif left_knee < 140:
        score += 15

    # Right Hip
    if right_hip < 90:
        score += 20
        issues.append("Right Hip Instability")
        exercises.append("Perform Hip Bridge and Side Leg Raises")
    elif right_hip < 140:
        score += 10

    # Left Hip
    if left_hip < 90:
        score += 20
        issues.append("Left Hip Instability")
        exercises.append("Strengthen Hip Abductor Muscles")
    elif left_hip < 140:
        score += 10

    # Right Elbow
    if right_elbow < 90:
        score += 10
        issues.append("Right Elbow Over Flexion")
        exercises.append("Reduce Arm Load and Perform Triceps Stretch")

    # Left Elbow
    if left_elbow < 90:
        score += 10
        issues.append("Left Elbow Over Flexion")
        exercises.append("Improve Elbow Mobility Exercises")

    # Risk Level
    if score <= 25:
        risk = "LOW RISK"
    elif score <= 55:
        risk = "MEDIUM RISK"
    else:
        risk = "HIGH RISK"

    return risk, score, issues, exercises
