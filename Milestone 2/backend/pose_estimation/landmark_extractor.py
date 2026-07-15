from mediapipe.tasks.python.vision import PoseLandmarkerResult


class LandmarkExtractor:

    def __init__(self):

        self.landmark_names = [
            "NOSE",
            "LEFT_EYE_INNER",
            "LEFT_EYE",
            "LEFT_EYE_OUTER",
            "RIGHT_EYE_INNER",
            "RIGHT_EYE",
            "RIGHT_EYE_OUTER",
            "LEFT_EAR",
            "RIGHT_EAR",
            "MOUTH_LEFT",
            "MOUTH_RIGHT",
            "LEFT_SHOULDER",
            "RIGHT_SHOULDER",
            "LEFT_ELBOW",
            "RIGHT_ELBOW",
            "LEFT_WRIST",
            "RIGHT_WRIST",
            "LEFT_PINKY",
            "RIGHT_PINKY",
            "LEFT_INDEX",
            "RIGHT_INDEX",
            "LEFT_THUMB",
            "RIGHT_THUMB",
            "LEFT_HIP",
            "RIGHT_HIP",
            "LEFT_KNEE",
            "RIGHT_KNEE",
            "LEFT_ANKLE",
            "RIGHT_ANKLE",
            "LEFT_HEEL",
            "RIGHT_HEEL",
            "LEFT_FOOT_INDEX",
            "RIGHT_FOOT_INDEX"
        ]

    def extract(self, results, frame_num, timestamp=None):

        if len(results.pose_landmarks) == 0:
            return None

        frame_data = []

        landmarks = results.pose_landmarks[0]

        for idx, landmark in enumerate(landmarks):

            frame_data.append({

                "frame": frame_num,
                "timestamp": timestamp,

                "landmark_id": idx,
                "landmark_name": self.landmark_names[idx],

                "x": landmark.x,
                "y": landmark.y,
                "z": landmark.z,

                "visibility": landmark.visibility,
                "presence": landmark.presence

            })

        return frame_data


if __name__ == "__main__":

    from video_reader import VideoReader
    from pose_detector import PoseDetector
    from csv_exporter import CSVExporter

    MODEL_PATH = "Milestone 2/models/pose_landmarker.task"
    VIDEO_PATH = "Milestone 2/videos/running.mp4"

    reader = VideoReader(VIDEO_PATH)
    detector = PoseDetector(MODEL_PATH)
    extractor = LandmarkExtractor()
    exporter = CSVExporter()

    metadata = reader.get_metadata()
    fps = metadata["fps"]

    all_landmarks = []
    frame_num = 0

    for frame in reader.frames():

        timestamp_ms = int((frame_num / fps) * 1000)

        results = detector.detect(frame, timestamp_ms)

        frame_num += 1

        frame_data = extractor.extract(
            results,
            frame_num,
            timestamp_ms / 1000
        )

        if frame_data:
            all_landmarks.extend(frame_data)

    print("\n========== LANDMARK EXTRACTION ==========")
    print(f"Frames Processed : {frame_num}")
    print(f"Landmarks Found  : {len(all_landmarks)}")
    print(f"Expected         : {frame_num * 33}")

    print("\nFirst 3 landmarks:\n")

    for landmark in all_landmarks[:3]:
        print(landmark)

    exporter.export(
        all_landmarks,
        "running_landmarks.csv"
    )

    detector.close()