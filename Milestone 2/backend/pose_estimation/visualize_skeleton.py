import cv2
import os

from video_reader import VideoReader
from pose_detector import PoseDetector

# MediaPipe Pose landmark connections
POSE_CONNECTIONS = [
    (11, 12), (11, 13), (13, 15),
    (12, 14), (14, 16),
    (11, 23), (12, 24), (23, 24),
    (23, 25), (25, 27), (27, 29), (29, 31), (27, 31),
    (24, 26), (26, 28), (28, 30), (30, 32), (28, 32),
    (15, 17), (15, 19), (15, 21), (17, 19),
    (16, 18), (16, 20), (16, 22), (18, 20),
    (9, 10),
    (0, 1), (1, 2), (2, 3), (3, 7),
    (0, 4), (4, 5), (5, 6), (6, 8)
]


def draw_landmarks(frame, landmarks):

    height, width = frame.shape[:2]

    points = []

    for landmark in landmarks:

        x = int(landmark.x * width)
        y = int(landmark.y * height)

        points.append((x, y, landmark.visibility))

        if landmark.visibility > 0.5:
            cv2.circle(frame, (x, y), 4, (0, 255, 0), -1)

    for start, end in POSE_CONNECTIONS:

        if start >= len(points) or end >= len(points):
            continue

        x1, y1, v1 = points[start]
        x2, y2, v2 = points[end]

        if v1 > 0.5 and v2 > 0.5:
            cv2.line(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)

    return frame


def main():

    VIDEO_PATH = "Milestone 2/videos/running.mp4"
    MODEL_PATH = "Milestone 2/models/pose_landmarker.task"

    OUTPUT_PATH = "Milestone 2/outputs/running_annotated.mp4"

    reader = VideoReader(VIDEO_PATH)
    detector = PoseDetector(MODEL_PATH)

    writer = cv2.VideoWriter(
        OUTPUT_PATH,
        cv2.VideoWriter_fourcc(*"mp4v"),
        reader.fps,
        (reader.width, reader.height)
    )

    metadata = reader.get_metadata()
    fps = metadata["fps"]

    frame_number = 0
    detected = 0

    for frame in reader.frames():

        timestamp = int((frame_number / fps) * 1000)

        results = detector.detect(frame, timestamp)

        annotated = frame.copy()

        if len(results.pose_landmarks) > 0:

            detected += 1

            annotated = draw_landmarks(
                annotated,
                results.pose_landmarks[0]
            )

        writer.write(annotated)

        frame_number += 1

    writer.release()
    detector.close()

    print("\n========== VISUALIZATION ==========")
    print(f"Frames Processed : {frame_number}")
    print(f"Pose Detected    : {detected}")
    print(f"Saved Video      : {OUTPUT_PATH}")


if __name__ == "__main__":
    main()