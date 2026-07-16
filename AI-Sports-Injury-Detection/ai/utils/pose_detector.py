import cv2
import mediapipe as mp

from joint_angles import get_joint_angles
from injury_detector import detect_injury_risk
from risk_score import calculate_risk_score
from report_generator import generate_report
from joint_visualizer import draw_risky_joints
from report_generator import save_report

# Initialize MediaPipe Pose
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

pose = mp_pose.Pose()

# Load video
video = cv2.VideoCapture("../sample_videos/sample.mp4")

fourcc=cv2.VideoWriter_fourcc(*'mp4v')

out=cv2.VideoWriter(
    "../outputs/output_video.mp4",
    fourcc,
    20,
    (800,450)
)
print("Video Writer Open:", out.isOpened())
# Lists to store data for the entire video
left_knees = []
right_knees = []
risk_scores = []

while video.isOpened():

    success, frame = video.read()

    if not success:
        break

    # Resize frame
    frame = cv2.resize(frame, (800, 450))

    # Convert BGR to RGB
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Detect pose
    results = pose.process(rgb)

    if results.pose_landmarks:

        # Draw skeleton
        mp_drawing.draw_landmarks(
            frame,
            results.pose_landmarks,
            mp_pose.POSE_CONNECTIONS
        )

        # Get landmarks
        landmarks = results.pose_landmarks.landmark

        # Calculate joint angles
        angles = get_joint_angles(landmarks, mp_pose)
        draw_risky_joints(
            frame,
            landmarks,
            mp_pose,
            angles
        )


        # Store knee angles
        left_knees.append(angles["Left Knee"])
        right_knees.append(angles["Right Knee"])

        # Detect injury risk
        risk_messages = detect_injury_risk(angles)

        # Calculate risk score
        risk_score, status = calculate_risk_score(angles)

        # Store risk score
        risk_scores.append(risk_score)

        y = 30

        # Display joint angles
        for joint, angle in angles.items():

            cv2.putText(
                frame,
                f"{joint}: {int(angle)}",
                (20, y),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 255, 0),
                2
            )

            y += 30

        # Leave some space
        y += 20

        # Display injury warnings
        for message in risk_messages:

            cv2.putText(
                frame,
                message,
                (20, y),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 0, 255),
                2
            )

            y += 30

        # Leave some space
        y += 20

        # Display risk score
        cv2.putText(
            frame,
            f"Risk Score: {risk_score}% ({status})",
            (20, y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 0, 0),
            2
        )

    # Show video
    out.write(frame)
    cv2.imshow("Pose Detection", frame)
    

    # Press Q to quit
    if cv2.waitKey(20) & 0xFF == ord("q"):
        break

# Generate report after processing the whole video
if len(left_knees) > 0:
    generate_report(
        left_knees,
        right_knees,
        risk_scores
    )

    save_report(
        angles,
        risk_score,
        risk_messages
    )



# Release resources
video.release()
out.release()
cv2.destroyAllWindows()