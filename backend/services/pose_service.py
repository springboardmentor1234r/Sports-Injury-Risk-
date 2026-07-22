import cv2
import mediapipe as mp

from services.angle_service import calculate_angle

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils


def process_video(input_path, output_path):

    cap = cv2.VideoCapture(input_path)

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    joint_angles = {}

    elbow_angles = []
    knee_angles = []
    hip_angles = []

    with mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    ) as pose:

        while cap.isOpened():

            success, frame = cap.read()

            if not success:
                break

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            results = pose.process(rgb)

            if results.pose_landmarks:

                landmarks = results.pose_landmarks.landmark

                # LEFT SIDE
                shoulder = (
                    landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
                    landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y,
                )

                elbow = (
                    landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x,
                    landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y,
                )

                wrist = (
                    landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x,
                    landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y,
                )

                hip = (
                    landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x,
                    landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y,
                )

                knee = (
                    landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x,
                    landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y,
                )

                ankle = (
                    landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x,
                    landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y,
                )

                # Calculate angles
                elbow_angle = calculate_angle(shoulder, elbow, wrist)
                knee_angle = calculate_angle(hip, knee, ankle)
                hip_angle = calculate_angle(shoulder, hip, knee)

                elbow_angles.append(elbow_angle)
                knee_angles.append(knee_angle)
                hip_angles.append(hip_angle)

                joint_angles = {
                    "left_elbow": elbow_angle,
                    "left_knee": knee_angle,
                    "left_hip": hip_angle,
                }

                cv2.putText(
                    frame,
                    f"Left Elbow: {elbow_angle:.1f}",
                    (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 255, 0),
                    2
                )

                cv2.putText(
                    frame,
                    f"Left Knee: {knee_angle:.1f}",
                    (20, 70),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 255, 0),
                    2
               )

                cv2.putText(
                    frame,
                    f"Left Hip: {hip_angle:.1f}",
                    (20, 100),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 255, 0),
                    2
                )

                mp_drawing.draw_landmarks(
                    frame,
                    results.pose_landmarks,
                    mp_pose.POSE_CONNECTIONS
                )

            out.write(frame)

    cap.release()
    out.release()

    if elbow_angles:
        joint_angles = {
            "left_elbow": round(sum(elbow_angles) / len(elbow_angles), 2),
            "left_knee": round(sum(knee_angles) / len(knee_angles), 2),
            "left_hip": round(sum(hip_angles) / len(hip_angles), 2),
        }

    return joint_angles