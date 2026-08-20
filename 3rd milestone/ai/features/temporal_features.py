"""
Temporal feature extraction from pose sequences.

Computes velocity, acceleration, jerk, and movement smoothness
from time-series landmark data.
"""
import numpy as np
from typing import Dict


def compute_velocity(positions: np.ndarray, fps: float = 30.0) -> np.ndarray:
    """First derivative of position: v = Δp / Δt"""
    dt = 1.0 / fps
    return np.gradient(positions, dt, axis=0)


def compute_acceleration(positions: np.ndarray, fps: float = 30.0) -> np.ndarray:
    """Second derivative of position: a = Δv / Δt"""
    velocity = compute_velocity(positions, fps)
    dt = 1.0 / fps
    return np.gradient(velocity, dt, axis=0)


def compute_jerk(positions: np.ndarray, fps: float = 30.0) -> np.ndarray:
    """Third derivative of position: j = Δa / Δt (smoothness indicator)"""
    acceleration = compute_acceleration(positions, fps)
    dt = 1.0 / fps
    return np.gradient(acceleration, dt, axis=0)


def movement_smoothness(jerk: np.ndarray, duration: float) -> float:
    """
    Normalized mean squared jerk — lower = smoother movement.

    NMSJ = (duration^5 / amplitude^2) × ∫jerk² dt
    """
    jerk_magnitude = np.linalg.norm(jerk, axis=-1) if jerk.ndim > 1 else jerk
    mj = np.mean(jerk_magnitude ** 2)
    return float(mj * duration ** 5) if mj > 0 else 0.0


def extract_temporal_features(
    pose_sequence: np.ndarray,
    fps: float = 30.0
) -> Dict[str, float]:
    """
    Extract temporal features from a sequence of pose landmarks.

    Args:
        pose_sequence: (T, 33, 3) array of pose landmarks over time
        fps: Frame rate

    Returns:
        Dictionary of temporal features
    """
    T = pose_sequence.shape[0]
    duration = T / fps

    # Flatten per frame: (T, 99) for 33 landmarks × 3 coords
    flat = pose_sequence.reshape(T, -1)

    vel = compute_velocity(flat, fps)
    acc = compute_acceleration(flat, fps)
    jerk = compute_jerk(flat, fps)

    vel_mag = np.linalg.norm(vel, axis=1)
    acc_mag = np.linalg.norm(acc, axis=1)

    return {
        'mean_velocity': float(np.mean(vel_mag)),
        'max_velocity': float(np.max(vel_mag)),
        'std_velocity': float(np.std(vel_mag)),
        'mean_acceleration': float(np.mean(acc_mag)),
        'max_acceleration': float(np.max(acc_mag)),
        'std_acceleration': float(np.std(acc_mag)),
        'smoothness': movement_smoothness(jerk, duration),
        'duration': duration,
        'total_frames': T,
    }
