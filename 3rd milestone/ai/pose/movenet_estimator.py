"""
MoveNet pose estimator for comparison with MediaPipe.

MoveNet detects 17 COCO keypoints (vs MediaPipe's 33).
Available in Lightning (faster) and Thunder (more accurate) variants.

Note: MediaPipe was selected as the primary model due to 33 landmarks and 3D support.
"""
import numpy as np
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

MOVENET_KEYPOINTS = [
    'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
    'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
    'left_knee', 'right_knee', 'left_ankle', 'right_ankle',
]


class MoveNetEstimator:
    """
    MoveNet pose estimator using TensorFlow Hub.

    Supports Lightning (faster, ~30fps) and Thunder (more accurate, ~15fps).
    Detects 17 COCO keypoints.
    """

    def __init__(self, model_type: str = 'lightning'):
        """
        Initialize MoveNet estimator.

        Args:
            model_type: 'lightning' for speed, 'thunder' for accuracy
        """
        self.model_type = model_type
        self.model = None
        self.input_size = 192 if model_type == 'lightning' else 256
        self.keypoint_names = MOVENET_KEYPOINTS
        self._load_model()

    def _load_model(self):
        """Load MoveNet model from TensorFlow Hub."""
        try:
            import tensorflow as tf
            import tensorflow_hub as hub
            model_name = f"movenet_{self.model_type}"
            url = f"https://tfhub.dev/google/movenet/singlepose/{self.model_type}/4"
            self.model = hub.load(url)
            self.movenet = self.model.signatures['serving_default']
        except Exception as e:
            print(f"MoveNet not available: {e}. Using mock mode.")
            self.model = None

    def estimate_pose(self, frame: np.ndarray) -> Dict:
        """
        Estimate pose from a single frame.

        Args:
            frame: BGR image (H, W, 3)

        Returns:
            Dict with keypoints (17, 3) where each is (y, x, confidence)
        """
        if self.model is None:
            # Return mock data for testing
            return {
                'keypoints': np.random.rand(17, 3).astype(np.float32),
                'keypoint_names': self.keypoint_names,
                'model': f'movenet_{self.model_type}',
                'mock': True,
            }

        import tensorflow as tf
        img = tf.image.resize_with_pad(tf.expand_dims(frame, axis=0), self.input_size, self.input_size)
        img = tf.cast(img, dtype=tf.int32)
        outputs = self.movenet(img)
        keypoints = outputs['output_0'].numpy().reshape(17, 3)

        return {
            'keypoints': keypoints,
            'keypoint_names': self.keypoint_names,
            'model': f'movenet_{self.model_type}',
            'mock': False,
        }

    def process_video(self, frames: List[np.ndarray]) -> List[Dict]:
        """Process multiple frames and return pose results."""
        return [self.estimate_pose(frame) for frame in frames]
