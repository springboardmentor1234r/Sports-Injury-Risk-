import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision


class PoseDetector:
    def __init__(self, model_path):
        BaseOptions = python.BaseOptions
        PoseLandmarker = vision.PoseLandmarker
        PoseLandmarkerOptions = vision.PoseLandmarkerOptions
        RunningMode = vision.RunningMode

        options = PoseLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=model_path),
            running_mode=RunningMode.VIDEO,
            num_poses=1,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )

        self.detector = PoseLandmarker.create_from_options(options)

    def detect(self, frame, timestamp_ms):
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=rgb
        )

        return self.detector.detect_for_video(mp_image, timestamp_ms)

    def close(self):
        self.detector.close()


if __name__ == "__main__":

    from video_reader import VideoReader

    MODEL_PATH = "Milestone 2/models/pose_landmarker.task"
    VIDEO_PATH = "Milestone 2/videos/running.mp4"

    reader = VideoReader(VIDEO_PATH)
    detector = PoseDetector(MODEL_PATH)

    metadata = reader.get_metadata()
    fps = metadata["fps"]

    total_frames = 0
    detected_frames = 0

    for frame in reader.frames():

        timestamp = int((total_frames / fps) * 1000)

        result = detector.detect(frame, timestamp)

        total_frames += 1

        if result.pose_landmarks:
            detected_frames += 1

    print("\n========== RESULT ==========")
    print(f"Total Frames      : {total_frames}")
    print(f"Detected Frames   : {detected_frames}")
    print(f"Detection Rate    : {detected_frames/total_frames*100:.2f}%")

    detector.close()