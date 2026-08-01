"""
Balance metrics analysis module.

Estimates balance and stability from pose landmarks using center of pressure (CoP)
approximation and sway analysis.

Key Metrics:
    - Center of Pressure (CoP): Weighted average of foot contact points
    - Postural Sway: Standard deviation of CoP displacement
    - Stability Index: 100 - normalized_sway (0-100 scale)
"""
import numpy as np
from typing import Dict, List, Tuple


def estimate_center_of_pressure(
    left_ankle: np.ndarray,
    right_ankle: np.ndarray,
    left_heel: np.ndarray,
    right_heel: np.ndarray,
    weight_distribution: float = 0.5,
) -> np.ndarray:
    """
    Estimate Center of Pressure (CoP) from foot landmarks.

    CoP = w_left × midpoint_left + w_right × midpoint_right

    Args:
        left_ankle: (x, y, z) left ankle position
        right_ankle: (x, y, z) right ankle position
        left_heel: (x, y, z) left heel position
        right_heel: (x, y, z) right heel position
        weight_distribution: weight fraction on left foot (0-1)

    Returns:
        Estimated CoP position (x, y, z)
    """
    left_foot_center = (left_ankle + left_heel) / 2
    right_foot_center = (right_ankle + right_heel) / 2
    cop = weight_distribution * left_foot_center + (1 - weight_distribution) * right_foot_center
    return cop


def compute_sway(cop_trajectory: np.ndarray) -> Dict[str, float]:
    """
    Compute postural sway metrics from CoP time series.

    Args:
        cop_trajectory: (N, 2) array of CoP positions over time (x, y)

    Returns:
        Dictionary of sway metrics
    """
    if len(cop_trajectory) < 2:
        return {'sway_area': 0, 'sway_velocity': 0, 'ml_range': 0, 'ap_range': 0}

    # Medio-lateral (ML) = x, Anterior-posterior (AP) = y
    ml = cop_trajectory[:, 0]
    ap = cop_trajectory[:, 1]

    # Path length (total sway distance)
    displacements = np.diff(cop_trajectory, axis=0)
    path_length = np.sum(np.linalg.norm(displacements, axis=1))

    # Sway area (95% confidence ellipse area)
    cov_matrix = np.cov(cop_trajectory.T)
    eigenvalues = np.linalg.eigvalsh(cov_matrix)
    sway_area = np.pi * 2.4477 * np.sqrt(np.prod(np.abs(eigenvalues)))  # 95% CI

    return {
        'sway_area': float(sway_area),
        'path_length': float(path_length),
        'sway_velocity': float(path_length / len(cop_trajectory)),
        'ml_range': float(np.ptp(ml)),
        'ap_range': float(np.ptp(ap)),
        'ml_std': float(np.std(ml)),
        'ap_std': float(np.std(ap)),
        'rms_sway': float(np.sqrt(np.mean(ml**2 + ap**2))),
    }


def stability_index(sway_metrics: Dict[str, float], max_sway: float = 50.0) -> float:
    """
    Calculate stability index (0-100, 100 = perfectly stable).

    Stability = 100 - (rms_sway / max_sway) × 100

    Normal rms_sway during standing: ~5-15mm
    High risk rms_sway: >30mm
    """
    rms = sway_metrics.get('rms_sway', 0)
    index = max(0, min(100, 100 - (rms / max_sway) * 100))
    return float(index)


def single_leg_balance_score(
    cop_trajectory: np.ndarray,
    duration_seconds: float
) -> Dict[str, float]:
    """
    Score single-leg balance test performance.

    Returns time to stabilization, sway metrics, and overall score.
    """
    sway = compute_sway(cop_trajectory)
    score = stability_index(sway)

    return {
        **sway,
        'stability_index': score,
        'duration': duration_seconds,
        'risk_level': 'LOW' if score > 80 else 'MEDIUM' if score > 60 else 'HIGH' if score > 40 else 'CRITICAL',
    }
