import cv2
import mediapipe as mp
import os

from joint_angles import get_joint_angles
from injury_detector import detect_injury_risk
from risk_score import calculate_risk_score
from report_generator import generate_report
from joint_visualizer import draw_risky_joints
from report_generator import save_report
from running_phase import detect_running_phase
from knee_over_toe import check_knee_over_toe
from graph_generator import generate_graph
from movement_quality import evaluate_movement_quality
from symmetry_analysis import analyze_symmetry
from ml.predict_injury import predict_injury
from recommendation_engine import generate_recommendations

# Initialize MediaPipe Pose
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

pose = mp_pose.Pose()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load video
video_path = os.path.join(BASE_DIR, "..", "sample_videos", "sample.mp4")
output_path = os.path.join(BASE_DIR, "..", "outputs", "output_video.mp4")

video = cv2.VideoCapture(video_path)
if not video.isOpened():
    raise FileNotFoundError(f"Could not open video file: {video_path}")

fourcc = cv2.VideoWriter_fourcc(*"mp4v")

out = cv2.VideoWriter(
    output_path,
    fourcc,
    20,
    (800, 450)
)
print("Video Writer Open:", out.isOpened())
# Lists to store data for the entire video
left_knees = []
right_knees = []
risk_scores = []

angles={}
risk_score=0
risk_messages=[]

movement_score = 0
movement_quality = "Unknown"

symmetry = {
    "Knee Status": "Unknown",
    "Elbow Status": "Unknown"
}

recommendations = []

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

        # ML Prediction
        ml_prediction = predict_injury(angles)

        # Movement Quality
        movement_score, movement_quality = evaluate_movement_quality(angles)

        # Symmetry Analysis
        symmetry = analyze_symmetry(angles)

        # Running Phase
        running_phase = detect_running_phase(angles)

        # Knee Over Toe Detection
        knee_warnings = check_knee_over_toe(
            landmarks,
            mp_pose
        )

        # AI Recommendations
        recommendations = generate_recommendations(
            angles,
            risk_score,
            movement_quality,
            symmetry,
            running_phase
        )

        # Store Risk Score
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
        y += 40

        cv2.putText(
            frame,
            f"ML Prediction: {ml_prediction}",
            (20,y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0,255,255),
            2
        )
        y+=40

        cv2.putText(
            frame,
            f"Movement Quality: {movement_quality}",
            (20, y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 255, 255),
            2
        )

        y += 40

        cv2.putText(
            frame,
            f"Movement Score: {movement_score}/100",
            (20, y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 255),
            2
        )

        y += 40
        


        cv2.putText(
            frame,
            f"Running Phase: {running_phase}",
            (20, y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 0),
            2
        )
        y += 40

        for warning in knee_warnings:

            cv2.putText(
                frame,
                warning,
                (20, y),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 165, 255),
                2
            )

            y += 30
        cv2.putText(
            frame,
            f"Knee: {symmetry['Knee Status']}",
            (20, y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 0),
            2
        )

        y += 30

        cv2.putText(
            frame,
            f"Elbow: {symmetry['Elbow Status']}",
            (20, y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 0),
            2
        )

        y += 40

    

        cv2.putText(
            frame,
            "Recommendations:",
            (20, y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 255),
            2
        )

        y += 30

        for recommendation in recommendations[:4]:

            cv2.putText(
                frame,
                recommendation,
                (20, y),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 255, 255),
                2
            )

            y += 25



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
        risk_scores,
        recommendations
    )
    generate_graph(
    left_knees,
    right_knees
    )

    if angles:
        save_report(
            angles,
            risk_score,
            risk_messages,
            movement_score,
            movement_quality,
            symmetry,
            recommendations
        )


# Release resources
if video.isOpened():
    video.release()
if out.isOpened():
    out.release()
cv2.destroyAllWindows()