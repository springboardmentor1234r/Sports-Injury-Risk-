"""
Pose feature extraction from MediaPipe landmarks.

Extracts spatial features from 33 body landmarks including:
- Inter-joint distances
- Joint angle ratios
- Body segment proportions
- Normalized landmark positions
"""
import numpy as np
from typing import Dict, List


def extract_distances(landmarks: np.ndarray) -> Dict[str, float]:
    """
    Extract key inter-joint distances from landmarks.

    Args:
        landmarks: (33, 3) array of landmark positions

    Returns:
        Dictionary of distance features
    """
    def dist(a, b):
        return float(np.linalg.norm(landmarks[a] - landmarks[b]))

    return {
        'shoulder_width': dist(11, 12),
        'hip_width': dist(23, 24),
        'left_arm_length': dist(11, 13) + dist(13, 15),
        'right_arm_length': dist(12, 14) + dist(14, 16),
        'left_leg_length': dist(23, 25) + dist(25, 27),
        'right_leg_length': dist(24, 26) + dist(26, 28),
        'torso_length': (dist(11, 23) + dist(12, 24)) / 2,
        'left_thigh': dist(23, 25),
        'right_thigh': dist(24, 26),
        'left_shank': dist(25, 27),
        'right_shank': dist(26, 28),
        'left_upper_arm': dist(11, 13),
        'right_upper_arm': dist(12, 14),
        'left_forearm': dist(13, 15),
        'right_forearm': dist(14, 16),
    }


def extract_ratios(distances: Dict[str, float]) -> Dict[str, float]:
    """Extract body proportion ratios from distances."""
    def safe_ratio(a, b):
        return a / b if b > 0 else 0

    return {
        'arm_ratio_lr': safe_ratio(distances['left_arm_length'], distances['right_arm_length']),
        'leg_ratio_lr': safe_ratio(distances['left_leg_length'], distances['right_leg_length']),
        'thigh_shank_ratio_l': safe_ratio(distances['left_thigh'], distances['left_shank']),
        'thigh_shank_ratio_r': safe_ratio(distances['right_thigh'], distances['right_shank']),
        'torso_leg_ratio': safe_ratio(distances['torso_length'], distances['left_leg_length']),
        'shoulder_hip_ratio': safe_ratio(distances['shoulder_width'], distances['hip_width']),
    }


def normalize_landmarks(landmarks: np.ndarray) -> np.ndarray:
    """
    Normalize landmarks relative to hip center and shoulder width.

    This makes features invariant to position, scale, and partially to orientation.
    """
    hip_center = (landmarks[23] + landmarks[24]) / 2
    shoulder_width = np.linalg.norm(landmarks[11] - landmarks[12])
    if shoulder_width < 1e-6:
        shoulder_width = 1.0
    centered = landmarks - hip_center
    normalized = centered / shoulder_width
    return normalized


def extract_pose_features(landmarks: np.ndarray) -> np.ndarray:
    """
    Extract complete pose feature vector from landmarks.

    Returns flattened array of all pose features.
    """
    normalized = normalize_landmarks(landmarks)
    distances = extract_distances(landmarks)
    ratios = extract_ratios(distances)

    features = list(normalized.flatten())
    features.extend(distances.values())
    features.extend(ratios.values())
    return np.array(features, dtype=np.float32)
