"""
MediaPipe Pose Estimator.
Selected model for 3D pose estimation (33 landmarks).
"""
import cv2
import mediapipe as mp
import numpy as np
from typing import Dict, Any, Optional

class MediaPipePoseEstimator:
    """
    3D Pose Estimation using MediaPipe.
    Extracts 33 landmarks with x, y, z, and visibility.
    """
    def __init__(self, static_image_mode=False, model_complexity=2):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=static_image_mode,
            model_complexity=model_complexity,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Map MediaPipe indices to names
        self.landmark_names = [
            "nose", "left_eye_inner", "left_eye", "left_eye_outer", "right_eye_inner", 
            "right_eye", "right_eye_outer", "left_ear", "right_ear", "mouth_left", 
            "mouth_right", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow", 
            "left_wrist", "right_wrist", "left_pinky", "right_pinky", "left_index", 
            "right_index", "left_thumb", "right_thumb", "left_hip", "right_hip", 
            "left_knee", "right_knee", "left_ankle", "right_ankle", "left_heel", 
            "right_heel", "left_foot_index", "right_foot_index"
        ]

    def predict(self, image: np.ndarray) -> Optional[Dict[str, np.ndarray]]:
        """
        Process an image and return 3D landmarks.
        """
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.pose.process(image_rgb)
        
        if not results.pose_world_landmarks:
            return None
            
        landmarks = {}
        for idx, landmark in enumerate(results.pose_world_landmarks.landmark):
            name = self.landmark_names[idx]
            landmarks[name] = np.array([landmark.x, landmark.y, landmark.z])
            
        return landmarks
