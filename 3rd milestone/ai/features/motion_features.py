"""
Motion quality features extracted from movement data.

Assesses movement quality, fluidity, consistency, and efficiency.
"""
import numpy as np
from typing import Dict


def movement_fluidity(velocity: np.ndarray) -> float:
    """
    Fluidity = 1 - (velocity_std / velocity_mean).
    Smoother, more consistent movements have higher fluidity.
    """
    mean_v = np.mean(np.abs(velocity))
    if mean_v < 1e-6:
        return 1.0
    return float(max(0, 1 - np.std(velocity) / mean_v))


def movement_consistency(joint_angles: np.ndarray) -> float:
    """
    Consistency measures how repeatable the movement pattern is.
    Lower coefficient of variation = higher consistency.
    """
    cv = np.std(joint_angles) / np.mean(np.abs(joint_angles)) if np.mean(np.abs(joint_angles)) > 0 else 1.0
    return float(max(0, 1 - cv))


def extract_motion_features(
    positions: np.ndarray,
    velocities: np.ndarray,
    accelerations: np.ndarray,
) -> Dict[str, float]:
    """
    Extract motion quality features.

    Returns dict with fluidity, consistency, efficiency, and variability metrics.
    """
    vel_mag = np.linalg.norm(velocities, axis=-1) if velocities.ndim > 1 else velocities
    acc_mag = np.linalg.norm(accelerations, axis=-1) if accelerations.ndim > 1 else accelerations

    # Path efficiency: straight-line distance / total path length
    if positions.ndim >= 2 and len(positions) > 1:
        straight = np.linalg.norm(positions[-1] - positions[0])
        path = np.sum(np.linalg.norm(np.diff(positions, axis=0), axis=-1))
        efficiency = straight / path if path > 0 else 1.0
    else:
        efficiency = 1.0

    return {
        'fluidity': movement_fluidity(vel_mag),
        'consistency': movement_consistency(vel_mag),
        'path_efficiency': float(efficiency),
        'velocity_variability': float(np.std(vel_mag)),
        'acceleration_variability': float(np.std(acc_mag)),
        'peak_velocity': float(np.max(vel_mag)),
        'peak_acceleration': float(np.max(acc_mag)),
        'movement_duration_ratio': float(np.sum(vel_mag > 0.1 * np.max(vel_mag)) / len(vel_mag)) if len(vel_mag) > 0 else 0,
    }
