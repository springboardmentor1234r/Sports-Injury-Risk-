from angle_calculator import calculate_angle

def get_joint_angles(landmarks, mp_pose):

    angles = {}

    # LEFT SHOULDER
    left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
    left_elbow = landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value]
    left_wrist = landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value]

    angles["Left Elbow"] = calculate_angle(
        left_shoulder,
        left_elbow,
        left_wrist
    )

    # RIGHT SHOULDER
    right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
    right_elbow = landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value]
    right_wrist = landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value]

    angles["Right Elbow"] = calculate_angle(
        right_shoulder,
        right_elbow,
        right_wrist
    )

    # LEFT LEG
    left_hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP.value]
    left_knee = landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value]
    left_ankle = landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value]

    angles["Left Knee"] = calculate_angle(
        left_hip,
        left_knee,
        left_ankle
    )

    # RIGHT LEG
    right_hip = landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value]
    right_knee = landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value]
    right_ankle = landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value]

    angles["Right Knee"] = calculate_angle(
        right_hip,
        right_knee,
        right_ankle
    )

    return angles