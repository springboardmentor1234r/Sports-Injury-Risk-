"""
Movement symmetry analysis module.

Computes bilateral symmetry indices between left and right body segments.
Asymmetry is a key indicator of injury risk and compensatory patterns.

Symmetry Index (SI):
    SI = (2 × |L - R|) / (L + R) × 100

Where:
    SI < 10%: Normal symmetry
    SI 10-15%: Mild asymmetry
    SI > 15%: Significant asymmetry (injury risk)
"""
import numpy as np
from typing import Dict, List, Tuple


def symmetry_index(left_value: float, right_value: float) -> float:
    """
    Calculate Symmetry Index between bilateral measurements.

    Formula: SI = (2 × |L - R|) / (L + R) × 100

    Args:
        left_value: Left side measurement
        right_value: Right side measurement

    Returns:
        Symmetry index as percentage (0 = perfect symmetry)
    """
    total = left_value + right_value
    if total == 0:
        return 0.0
    return (2 * abs(left_value - right_value)) / total * 100


def bilateral_difference(left_value: float, right_value: float) -> float:
    """Absolute bilateral difference."""
    return abs(left_value - right_value)


def bilateral_ratio(left_value: float, right_value: float) -> float:
    """Ratio of weaker to stronger side (0-1, 1 = perfect symmetry)."""
    if max(left_value, right_value) == 0:
        return 1.0
    return min(left_value, right_value) / max(left_value, right_value)


def analyze_joint_symmetry(
    left_angles: Dict[str, float],
    right_angles: Dict[str, float]
) -> Dict[str, Dict[str, float]]:
    """
    Comprehensive symmetry analysis for all joint pairs.

    Returns dict with symmetry_index, bilateral_diff, ratio for each joint.
    """
    results = {}
    for joint in left_angles:
        if joint in right_angles:
            l, r = left_angles[joint], right_angles[joint]
            results[joint] = {
                'left_value': l,
                'right_value': r,
                'symmetry_index': symmetry_index(l, r),
                'bilateral_difference': bilateral_difference(l, r),
                'bilateral_ratio': bilateral_ratio(l, r),
                'dominant_side': 'left' if l > r else 'right' if r > l else 'equal',
                'risk_flag': symmetry_index(l, r) > 15,
            }
    return results


def temporal_symmetry(
    left_series: np.ndarray,
    right_series: np.ndarray
) -> Dict[str, float]:
    """
    Analyze symmetry over a time series of bilateral measurements.

    Returns mean, std, max symmetry index and trend.
    """
    si_series = np.array([symmetry_index(l, r) for l, r in zip(left_series, right_series)])
    return {
        'mean_symmetry_index': float(np.mean(si_series)),
        'std_symmetry_index': float(np.std(si_series)),
        'max_symmetry_index': float(np.max(si_series)),
        'min_symmetry_index': float(np.min(si_series)),
        'trend': float(np.polyfit(np.arange(len(si_series)), si_series, 1)[0]),  # slope
        'asymmetry_episodes': int(np.sum(si_series > 15)),  # frames with significant asymmetry
    }


def overall_symmetry_score(joint_results: Dict[str, Dict[str, float]]) -> float:
    """
    Calculate overall body symmetry score (0-100, 100 = perfect symmetry).
    """
    if not joint_results:
        return 100.0
    indices = [v['symmetry_index'] for v in joint_results.values()]
    mean_si = np.mean(indices)
    return max(0, 100 - mean_si * 2)  # Scale: 0% SI → 100 score, 50% SI → 0 score
