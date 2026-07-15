from video_reader import VideoReader
from pose_detector import PoseDetector
from angle_calculator import AngleCalculator
from biomechanics_exporter import BiomechanicsExporter

# -----------------------------
# MediaPipe Landmark IDs
# -----------------------------

LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12

LEFT_ELBOW = 13
RIGHT_ELBOW = 14

LEFT_WRIST = 15
RIGHT_WRIST = 16

LEFT_HIP = 23
RIGHT_HIP = 24

LEFT_KNEE = 25
RIGHT_KNEE = 26

LEFT_ANKLE = 27
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

    calculator = AngleCalculator()
    exporter = BiomechanicsExporter()

    angle_data = []

    frame_number = 0

    for frame in reader.frames():

        timestamp_ms = int((frame_number / fps) * 1000)

        results = detector.detect(frame, timestamp_ms)

        frame_number += 1

        if len(results.pose_landmarks) == 0:
            continue

        landmarks = results.pose_landmarks[0]

        # -----------------------------
        # Knee Angles
        # -----------------------------

        left_knee = calculator.calculate_angle(
            point(landmarks[LEFT_HIP]),
            point(landmarks[LEFT_KNEE]),
            point(landmarks[LEFT_ANKLE])
        )

        right_knee = calculator.calculate_angle(
            point(landmarks[RIGHT_HIP]),
            point(landmarks[RIGHT_KNEE]),
            point(landmarks[RIGHT_ANKLE])
        )

        # -----------------------------
        # Hip Angles
        # -----------------------------

        left_hip = calculator.calculate_angle(
            point(landmarks[LEFT_SHOULDER]),
            point(landmarks[LEFT_HIP]),
            point(landmarks[LEFT_KNEE])
        )

        right_hip = calculator.calculate_angle(
            point(landmarks[RIGHT_SHOULDER]),
            point(landmarks[RIGHT_HIP]),
            point(landmarks[RIGHT_KNEE])
        )

        # -----------------------------
        # Elbow Angles
        # -----------------------------

        left_elbow = calculator.calculate_angle(
            point(landmarks[LEFT_SHOULDER]),
            point(landmarks[LEFT_ELBOW]),
            point(landmarks[LEFT_WRIST])
        )

        right_elbow = calculator.calculate_angle(
            point(landmarks[RIGHT_SHOULDER]),
            point(landmarks[RIGHT_ELBOW]),
            point(landmarks[RIGHT_WRIST])
        )

        # -----------------------------
        # Shoulder Angles
        # -----------------------------

        left_shoulder = calculator.calculate_angle(
            point(landmarks[LEFT_ELBOW]),
            point(landmarks[LEFT_SHOULDER]),
            point(landmarks[LEFT_HIP])
        )

        right_shoulder = calculator.calculate_angle(
            point(landmarks[RIGHT_ELBOW]),
            point(landmarks[RIGHT_SHOULDER]),
            point(landmarks[RIGHT_HIP])
        )

        print(
            f"Frame {frame_number:03d} | "
            f"LK:{left_knee:6.2f}° "
            f"RK:{right_knee:6.2f}° | "
            f"LH:{left_hip:6.2f}° "
            f"RH:{right_hip:6.2f}° | "
            f"LE:{left_elbow:6.2f}° "
            f"RE:{right_elbow:6.2f}° | "
            f"LS:{left_shoulder:6.2f}° "
            f"RS:{right_shoulder:6.2f}°"
        )

        angle_data.append({
            "frame": frame_number,
            "left_knee": round(left_knee, 2),
            "right_knee": round(right_knee, 2),
            "left_hip": round(left_hip, 2),
            "right_hip": round(right_hip, 2),
            "left_elbow": round(left_elbow, 2),
            "right_elbow": round(right_elbow, 2),
            "left_shoulder": round(left_shoulder, 2),
            "right_shoulder": round(right_shoulder, 2)
        })

    exporter.export(
        angle_data,
        "running_joint_angles.csv"
    )

    detector.close()

    print("\n========== COMPLETE ==========")
    print(f"Frames Processed : {frame_number}")