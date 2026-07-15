from video_reader import VideoReader
from pose_detector import PoseDetector
from joint_angle_calculator import JointAngleCalculator
from angle_exporter import AngleExporter


LEFT_HIP = 23
LEFT_KNEE = 25
LEFT_ANKLE = 27

RIGHT_HIP = 24
RIGHT_KNEE = 26
RIGHT_ANKLE = 28


def point(landmark):
    return (landmark.x, landmark.y)


if __name__ == "__main__":

    MODEL_PATH = "Milestone 2/models/pose_landmarker.task"
    VIDEO_PATH = "Milestone 2/videos/running.mp4"

    reader = VideoReader(VIDEO_PATH)
    detector = PoseDetector(MODEL_PATH)

    metadata = reader.get_metadata()
    fps = metadata["fps"]

    calculator = JointAngleCalculator()
    exporter = AngleExporter()

    angle_data = []

    frame_number = 0

    for frame in reader.frames():

        timestamp_ms = int((frame_number / fps) * 1000)

        results = detector.detect(frame, timestamp_ms)

        frame_number += 1

        if len(results.pose_landmarks) == 0:
            continue

        landmarks = results.pose_landmarks[0]

        left_angle = calculator.calculate_angle(
            point(landmarks[LEFT_HIP]),
            point(landmarks[LEFT_KNEE]),
            point(landmarks[LEFT_ANKLE])
        )

        right_angle = calculator.calculate_angle(
            point(landmarks[RIGHT_HIP]),
            point(landmarks[RIGHT_KNEE]),
            point(landmarks[RIGHT_ANKLE])
        )

        print(
            f"Frame {frame_number:03d} | "
            f"Left Knee: {left_angle:.2f}° | "
            f"Right Knee: {right_angle:.2f}°"
        )

        angle_data.append({
            "frame": frame_number,
            "left_knee_angle": round(left_angle, 2),
            "right_knee_angle": round(right_angle, 2)
        })

    exporter.export(
        angle_data,
        "running_knee_angles.csv"
    )

    detector.close()

    print("\n========== COMPLETE ==========")
    print(f"Frames Processed : {frame_number}")
    print(f"CSV Saved        : Milestone 2/outputs/running_knee_angles.csv")