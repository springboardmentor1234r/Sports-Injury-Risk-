"""
Milestone 2 — Pose Estimation Engine (MediaPipe Tasks API)
Location: backend/services/pose_estimation.py

IMPORTANT: MediaPipe removed the old `mp.solutions.pose` API in recent
releases (0.10.31+). This uses the current replacement — the Tasks API
(`PoseLandmarker`) — which is what `pip install mediapipe` gives you today.

Covers PDF section "4. Pose Estimation Engine":
  - Human pose detection
  - Joint tracking
  - Skeleton generation (keypoints returned here are what the frontend
    draws the skeleton from — see VideoAnalysis.jsx)
  - Keypoint extraction

On first run, this downloads a small model file (~ a few MB to ~30MB
depending on variant) from Google's public model bucket into
backend/models/pose_landmarker.task and reuses it after that.
"""

import os
import urllib.request

import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_tasks
from mediapipe.tasks.python import vision as mp_vision

# MediaPipe still uses the same 33-point BlazePose topology under the new
# API, so the landmark index -> name mapping is unchanged.
LANDMARK_NAMES = {
    0: "nose",
    11: "left_shoulder",
    12: "right_shoulder",
    13: "left_elbow",
    14: "right_elbow",
    15: "left_wrist",
    16: "right_wrist",
    23: "left_hip",
    24: "right_hip",
    25: "left_knee",
    26: "right_knee",
    27: "left_ankle",
    28: "right_ankle",
    31: "left_foot_index",
    32: "right_foot_index",
}

SKELETON_CONNECTIONS = [
    ("left_shoulder", "right_shoulder"),
    ("left_shoulder", "left_elbow"),
    ("left_elbow", "left_wrist"),
    ("right_shoulder", "right_elbow"),
    ("right_elbow", "right_wrist"),
    ("left_shoulder", "left_hip"),
    ("right_shoulder", "right_hip"),
    ("left_hip", "right_hip"),
    ("left_hip", "left_knee"),
    ("left_knee", "left_ankle"),
    ("left_ankle", "left_foot_index"),
    ("right_hip", "right_knee"),
    ("right_knee", "right_ankle"),
    ("right_ankle", "right_foot_index"),
]

# "lite" = fastest/smallest (~5MB), "full" = balanced (~9MB), "heavy" = most
# accurate (~30MB, slowest). "full" is a good default for this project.
MODEL_URLS = {
    "lite": "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
    "full": "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
    "heavy": "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task",
}

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")


def _ensure_model_downloaded(variant: str = "full") -> str:
    os.makedirs(MODEL_DIR, exist_ok=True)
    model_path = os.path.join(MODEL_DIR, f"pose_landmarker_{variant}.task")

    if not os.path.exists(model_path):
        print(f"Downloading MediaPipe pose model ({variant})... this only happens once.")
        urllib.request.urlretrieve(MODEL_URLS[variant], model_path)
        print(f"Saved model to {model_path}")

    return model_path


class PoseEstimator:
    def __init__(self, model_variant: str = "full", min_detection_confidence: float = 0.5):
        model_path = _ensure_model_downloaded(model_variant)

        base_options = mp_tasks.BaseOptions(model_asset_path=model_path)
        options = mp_vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=mp_vision.RunningMode.VIDEO,
            num_poses=1,
            min_pose_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_detection_confidence,
        )
        self.landmarker = mp_vision.PoseLandmarker.create_from_options(options)

    def process_video(self, video_path: str, sample_every_n_frames: int = 2) -> dict:
        """
        Runs pose detection across a video file.

        sample_every_n_frames=2 means "process every 2nd frame" — cuts
        processing time roughly in half with little loss in analysis
        quality for movement/biomechanics purposes.
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video file: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        ms_per_frame = 1000.0 / fps

        frames_out = []
        frame_idx = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % sample_every_n_frames == 0:
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(rgb_frame))

                # Timestamp must strictly increase across calls — using the
                # frame's real position in the video (not a running counter)
                # keeps it correct even though we skip frames.
                timestamp_ms = int(frame_idx * ms_per_frame)
                result = self.landmarker.detect_for_video(mp_image, timestamp_ms)

                if result.pose_landmarks:
                    pose = result.pose_landmarks[0]  # num_poses=1, so just the first
                    keypoints = {}
                    for idx, name in LANDMARK_NAMES.items():
                        lm = pose[idx]
                        keypoints[name] = {
                            "x": round(lm.x, 4),
                            "y": round(lm.y, 4),
                            "z": round(lm.z, 4),
                            "visibility": round(getattr(lm, "visibility", 1.0), 4),
                        }

                    frames_out.append(
                        {
                            "frame_number": frame_idx,
                            "timestamp_ms": timestamp_ms,
                            "keypoints": keypoints,
                        }
                    )

            frame_idx += 1

        cap.release()

        return {
            "fps": fps,
            "total_frames": total_frames,
            "duration_seconds": (total_frames / fps) if fps else None,
            "frames": frames_out,
        }

    def close(self):
        self.landmarker.close()

