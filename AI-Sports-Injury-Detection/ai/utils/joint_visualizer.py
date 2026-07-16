import cv2


def draw_risky_joints(frame, landmarks, mp_pose, angles):

    h, w, _ = frame.shape

    # Highlight Left Knee
    if angles["Left Knee"] < 90:

        knee = landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value]

        x = int(knee.x * w)
        y = int(knee.y * h)

        cv2.circle(frame, (x, y), 12, (0, 0, 255), -1)

    # Highlight Right Knee
    if angles["Right Knee"] < 90:

        knee = landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value]

        x = int(knee.x * w)
        y = int(knee.y * h)

        cv2.circle(frame, (x, y), 12, (0, 0, 255), -1)

    # Highlight Left Elbow
    if angles["Left Elbow"] < 70:

        elbow = landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value]

        x = int(elbow.x * w)
        y = int(elbow.y * h)

        cv2.circle(frame, (x, y), 12, (0, 255, 255), -1)

    # Highlight Right Elbow
    if angles["Right Elbow"] < 70:

        elbow = landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value]

        x = int(elbow.x * w)
        y = int(elbow.y * h)

        cv2.circle(frame, (x, y), 12, (0, 255, 255), -1)