def check_knee_over_toe(landmarks, mp_pose):

    LEFT_KNEE = mp_pose.PoseLandmark.LEFT_KNEE.value
    LEFT_ANKLE = mp_pose.PoseLandmark.LEFT_ANKLE.value

    RIGHT_KNEE = mp_pose.PoseLandmark.RIGHT_KNEE.value
    RIGHT_ANKLE = mp_pose.PoseLandmark.RIGHT_ANKLE.value

    left_knee = landmarks[LEFT_KNEE]
    left_ankle = landmarks[LEFT_ANKLE]

    right_knee = landmarks[RIGHT_KNEE]
    right_ankle = landmarks[RIGHT_ANKLE]

    warnings = []

    if left_knee.x > left_ankle.x + 0.05:
        warnings.append("Left Knee Over Toe")

    if right_knee.x > right_ankle.x + 0.05:
        warnings.append("Right Knee Over Toe")

    return warnings