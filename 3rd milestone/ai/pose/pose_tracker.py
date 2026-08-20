"""
Temporal pose tracker for tracking landmarks across video frames.

Uses simple centroid tracking with Kalman filter-like smoothing
to maintain consistent pose identity and smooth noisy detections.
"""
import numpy as np
from typing import Dict, List, Optional, Tuple
from collections import deque


class PoseTracker:
    """
    Track pose landmarks across frames with temporal smoothing.

    Maintains a buffer of recent poses and applies exponential
    moving average smoothing to reduce jitter.
    """

    def __init__(self, buffer_size: int = 10, smoothing_alpha: float = 0.3):
        """
        Args:
            buffer_size: Number of frames to keep in history
            smoothing_alpha: EMA smoothing factor (0-1, lower = smoother)
        """
        self.buffer_size = buffer_size
        self.alpha = smoothing_alpha
        self.pose_buffer: deque = deque(maxlen=buffer_size)
        self.smoothed_pose: Optional[np.ndarray] = None
        self.frame_count = 0
        self.confidence_history: deque = deque(maxlen=buffer_size)

    def update(self, landmarks: np.ndarray, confidence: np.ndarray = None) -> np.ndarray:
        """
        Update tracker with new pose detection.

        Applies EMA smoothing: smoothed = α × new + (1-α) × previous

        Args:
            landmarks: (33, 3) array of landmark positions
            confidence: (33,) confidence scores per landmark

        Returns:
            Smoothed landmark positions
        """
        self.frame_count += 1
        self.pose_buffer.append(landmarks.copy())

        if confidence is not None:
            self.confidence_history.append(confidence)

        if self.smoothed_pose is None:
            self.smoothed_pose = landmarks.copy()
        else:
            # Apply exponential moving average
            self.smoothed_pose = self.alpha * landmarks + (1 - self.alpha) * self.smoothed_pose

            # For low-confidence landmarks, rely more on smoothed data
            if confidence is not None:
                for i in range(len(confidence)):
                    if confidence[i] < 0.5:
                        self.smoothed_pose[i] = (0.1 * landmarks[i] + 0.9 * self.smoothed_pose[i])

        return self.smoothed_pose.copy()

    def get_velocity(self) -> Optional[np.ndarray]:
        """Get velocity of each landmark from recent frames."""
        if len(self.pose_buffer) < 2:
            return None
        return self.pose_buffer[-1] - self.pose_buffer[-2]

    def get_trajectory(self, landmark_idx: int) -> np.ndarray:
        """Get the trajectory of a specific landmark over the buffer."""
        if len(self.pose_buffer) == 0:
            return np.array([])
        return np.array([pose[landmark_idx] for pose in self.pose_buffer])

    def interpolate_missing(self, landmarks: np.ndarray, confidence: np.ndarray,
                           threshold: float = 0.3) -> np.ndarray:
        """Interpolate missing/low-confidence landmarks from history."""
        result = landmarks.copy()
        if self.smoothed_pose is not None:
            for i in range(len(confidence)):
                if confidence[i] < threshold:
                    result[i] = self.smoothed_pose[i]
        return result

    def reset(self):
        """Reset tracker state."""
        self.pose_buffer.clear()
        self.confidence_history.clear()
        self.smoothed_pose = None
        self.frame_count = 0
