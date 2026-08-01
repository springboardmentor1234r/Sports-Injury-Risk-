"""
Landmark utility functions for pose data processing.

Provides conversion, normalization, visualization helpers,
and JSON export for 33 MediaPipe landmarks.
"""
import numpy as np
from typing import Dict, List, Tuple, Optional
import json

# MediaPipe Pose landmark indices
LANDMARK_NAMES = [
    'nose', 'left_eye_inner', 'left_eye', 'left_eye_outer',
    'right_eye_inner', 'right_eye', 'right_eye_outer',
    'left_ear', 'right_ear', 'mouth_left', 'mouth_right',
    'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist', 'left_pinky', 'right_pinky',
    'left_index', 'right_index', 'left_thumb', 'right_thumb',
    'left_hip', 'right_hip', 'left_knee', 'right_knee',
    'left_ankle', 'right_ankle', 'left_heel', 'right_heel',
    'left_foot_index', 'right_foot_index',
]

# Skeleton connections for drawing
SKELETON_CONNECTIONS = [
    (11, 12), (11, 13), (13, 15), (12, 14), (14, 16),  # Arms
    (11, 23), (12, 24), (23, 24),  # Torso
    (23, 25), (25, 27), (24, 26), (26, 28),  # Legs
    (27, 29), (29, 31), (28, 30), (30, 32),  # Feet
    (15, 17), (15, 19), (15, 21), (16, 18), (16, 20), (16, 22),  # Hands
]


def landmarks_to_numpy(landmarks) -> np.ndarray:
    """Convert MediaPipe landmarks to (33, 4) numpy array [x, y, z, visibility]."""
    if hasattr(landmarks, 'landmark'):
        return np.array([[lm.x, lm.y, lm.z, lm.visibility] for lm in landmarks.landmark])
    return np.array(landmarks)


def landmarks_to_dict(landmarks: np.ndarray) -> List[Dict]:
    """Convert landmarks array to list of dictionaries."""
    result = []
    for i, lm in enumerate(landmarks):
        entry = {
            'id': i,
            'name': LANDMARK_NAMES[i] if i < len(LANDMARK_NAMES) else f'landmark_{i}',
            'x': float(lm[0]),
            'y': float(lm[1]),
            'z': float(lm[2]) if len(lm) > 2 else 0.0,
        }
        if len(lm) > 3:
            entry['visibility'] = float(lm[3])
        result.append(entry)
    return result


def export_to_json(landmarks: np.ndarray, frame_number: int,
                   video_id: str = '', confidence: float = 1.0) -> str:
    """Export landmarks to JSON string for storage."""
    data = {
        'video_id': video_id,
        'frame_number': frame_number,
        'confidence': confidence,
        'landmarks': landmarks_to_dict(landmarks),
        'skeleton_connections': [list(c) for c in SKELETON_CONNECTIONS],
    }
    return json.dumps(data)


def normalize_to_frame(landmarks: np.ndarray, width: int, height: int) -> np.ndarray:
    """Convert normalized [0,1] coordinates to pixel coordinates."""
    result = landmarks.copy()
    result[:, 0] *= width
    result[:, 1] *= height
    return result


def get_landmark_by_name(landmarks: np.ndarray, name: str) -> Optional[np.ndarray]:
    """Get landmark coordinates by name."""
    if name in LANDMARK_NAMES:
        idx = LANDMARK_NAMES.index(name)
        return landmarks[idx]
    return None


def compute_body_center(landmarks: np.ndarray) -> np.ndarray:
    """Compute body center from hip midpoint."""
    left_hip = landmarks[23][:3]
    right_hip = landmarks[24][:3]
    return (left_hip + right_hip) / 2


def compute_body_height(landmarks: np.ndarray) -> float:
    """Estimate body height from head to ankle distance."""
    head = landmarks[0][:3]  # nose
    left_ankle = landmarks[27][:3]
    right_ankle = landmarks[28][:3]
    ankle_mid = (left_ankle + right_ankle) / 2
    return float(np.linalg.norm(head - ankle_mid))
