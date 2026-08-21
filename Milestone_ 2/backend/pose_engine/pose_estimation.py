import csv
import cv2
import mediapipe as mp
import math
from risk_prediction import predict_risk
# -----------------------------
# Function to calculate angle
# -----------------------------
def calculate_angle(a, b, c):
    angle = math.degrees(
        math.atan2(c[1] - b[1], c[0] - b[0]) -
        math.atan2(a[1] - b[1], a[0] - b[0])
    )

    if angle < 0:
        angle += 360

    if angle > 180:
        angle = 360 - angle

    return angle


# Initialize MediaPipe
mp_pose = mp.solutions.pose
pose = mp_pose.Pose()

mp_drawing = mp.solutions.drawing_utils

# CSV file
csv_file = open("reports/pose_landmarks.csv", "w", newline="")
csv_writer = csv.writer(csv_file)

csv_writer.writerow([
    "Frame",
    "Landmark",
    "X",
    "Y",
    "Z",
    "Visibility"
])

frame_number = 0
angles_file = open("reports/joint_angles.csv", "w", newline="")
angles_writer = csv.writer(angles_file)

angles_writer.writerow([
    "Frame",
    "Right Knee",
    "Left Knee",
    "Right Elbow",
    "Left Elbow",
    "Right Hip",
    "Left Hip",
    "Risk"
])

# Open video
import sys

if len(sys.argv) > 1:
    video_path = sys.argv[1]
else:
    video_path = "datasets/sample.mp4"

cap = cv2.VideoCapture(video_path)

while True:

    success, frame = cap.read()

    if not success:
        break

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    results = pose.process(rgb)

    frame_number += 1

    if results.pose_landmarks:

        landmarks = results.pose_landmarks.landmark

        # Save landmarks
        for idx, landmark in enumerate(landmarks):
            csv_writer.writerow([
                frame_number,
                idx,
                landmark.x,
                landmark.y,
                landmark.z,
                landmark.visibility
            ])

        # Right Hip
        hip = (
            landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].x,
            landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].y
        )

        # Right Knee
        knee = (
            landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].x,
            landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].y
        )

        # Right Ankle
        ankle = (
            landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].x,
            landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].y
        )
        # Left Hip
        left_hip = (
            landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x,
            landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y
        )

        # Left Knee
        left_knee = (
            landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x,
            landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y
        )

        # Left Ankle
        left_ankle = (
            landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x,
            landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y
        )

        # Calculate Left Knee Angle
        left_knee_angle = calculate_angle(left_hip, left_knee, left_ankle)
        # Right Shoulder
        right_shoulder = (
            landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x,
            landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y
        )

        # Right Elbow
        right_elbow = (
            landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].x,
            landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].y
        )

        # Right Wrist
        right_wrist = (
            landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].x,
            landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].y
        )

        # Calculate Right Elbow Angle
        right_elbow_angle = calculate_angle(
            right_shoulder,
            right_elbow,
            right_wrist
        )
        # Left Shoulder
        left_shoulder = (
            landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
            landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y
        )

        # Left Elbow
        left_elbow = (
            landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x,
            landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y
        )

        # Left Wrist
        left_wrist = (
            landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x,
            landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y
        )

        # Calculate Left Elbow Angle
        left_elbow_angle = calculate_angle(
            left_shoulder,
            left_elbow,
            left_wrist
        )
        # Right Shoulder
        right_shoulder = (
            landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x,
            landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y
        )

        # Right Hip
        right_hip = (
            landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].x,
            landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].y
        )

        # Right Knee
        right_knee = (
            landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].x,
            landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].y
        )

        # Calculate Right Hip Angle
        right_hip_angle = calculate_angle(
            right_shoulder,
            right_hip,
            right_knee
        )
        # Left Shoulder
        left_shoulder = (
            landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
            landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y
        )

        # Left Hip
        left_hip = (
            landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x,
            landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y
        )

        # Left Knee
        left_knee = (
            landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x,
            landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y
        )

        # Calculate Left Hip Angle
        left_hip_angle = calculate_angle(
            left_shoulder,
            left_hip,
            left_knee
        )


        # Calculate knee angle
        knee_angle = calculate_angle(hip, knee, ankle)

        # Risk Detection
        risk, score, issues, exercises = predict_risk(
            int(knee_angle),
            int(left_knee_angle),
            int(right_elbow_angle),
            int(left_elbow_angle),
            int(right_hip_angle),
            int(left_hip_angle)
        )

        if risk == "LOW RISK":
            color = (0, 255, 0)

        elif risk == "MEDIUM RISK":
            color = (0, 255, 255)

        else:
            color = (0, 0, 255)
        angles_writer.writerow([
            frame_number,
            int(knee_angle),
            int(left_knee_angle),
            int(right_elbow_angle),
            int(left_elbow_angle),
            int(right_hip_angle),
            int(left_hip_angle),
            risk
        ])

        # Draw skeleton
        mp_drawing.draw_landmarks(
            frame,
            results.pose_landmarks,
            mp_pose.POSE_CONNECTIONS
        )

        # Display Knee Angle
        cv2.putText(
            frame,
            f"Knee Angle: {int(knee_angle)}",
            (40, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            color,
            2
        )

        # Display Risk
        cv2.putText(
            frame,
            f"Risk: {risk}",
            (40, 80),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            color,
            2
        )

        cv2.putText(
            frame,
            f"Risk: {risk}",
            (40, 80),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            color,
            2
        )
        cv2.putText(
            frame,
            f"Left Knee: {int(left_knee_angle)}",
            (40, 120),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (255, 0, 0),
            2
        )
        cv2.putText(
            frame,
            f"Right Elbow: {int(right_elbow_angle)}",
            (40, 160),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (255, 255, 0),
            2
        )
        cv2.putText(
            frame,
            f"Left Elbow: {int(left_elbow_angle)}",
            (40, 200),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (255, 0, 255),
            2
        )
        cv2.putText(
            frame,
            f"Right Hip: {int(right_hip_angle)}",
            (40, 240),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 255),
            2
        )
        cv2.putText(
            frame,
            f"Left Hip: {int(left_hip_angle)}",
            (40, 280),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (255, 255, 255),
            2
        )

    cv2.imshow("Sports Injury Risk Detection", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
csv_file.close()
angles_file.close()
from datetime import datetime
risk, score, issues, exercises = predict_risk(
    int(knee_angle),
    int(left_knee_angle),
    int(right_elbow_angle),
    int(left_elbow_angle),
    int(right_hip_angle),
    int(left_hip_angle)
)

report_file = open("reports/analysis_report.txt", "w")

report_file.write("SPORTS INJURY RISK DETECTION REPORT\n")
report_file.write("=" * 50 + "\n\n")

report_file.write("Joint Angles\n")
report_file.write("-" * 20 + "\n")
report_file.write(f"Right Knee  : {int(knee_angle)}°\n")
report_file.write(f"Left Knee   : {int(left_knee_angle)}°\n")
report_file.write(f"Right Elbow : {int(right_elbow_angle)}°\n")
report_file.write(f"Left Elbow  : {int(left_elbow_angle)}°\n")
report_file.write(f"Right Hip   : {int(right_hip_angle)}°\n")
report_file.write(f"Left Hip    : {int(left_hip_angle)}°\n\n")

report_file.write("Risk Assessment\n")
report_file.write("-" * 20 + "\n")
report_file.write(f"Risk Level : {risk}\n")
report_file.write(f"Risk Score : {score}%\n\n")

report_file.write("Detected Issues\n")
report_file.write("-" * 20 + "\n")

for issue in issues:
    report_file.write(f"- {issue}\n")

report_file.write("\n")

report_file.write("Recommended Exercises\n")
report_file.write("-" * 25 + "\n")

for exercise in exercises:
    report_file.write(f"- {exercise}\n")

report_file.write("\n")

report_file.write("Generated On\n")
report_file.write("-" * 20 + "\n")
report_file.write(datetime.now().strftime("%d-%m-%Y %I:%M %p"))

report_file.close()
cv2.destroyAllWindows()
