"""
Statistical feature extraction from biomechanical signals.

Computes descriptive statistics, distribution metrics, and
time-domain features from any numerical signal.
"""
import numpy as np
from typing import Dict
from scipy import stats as scipy_stats


def extract_statistical_features(signal: np.ndarray, prefix: str = '') -> Dict[str, float]:
    """
    Extract comprehensive statistical features from a signal.

    Args:
        signal: 1D numerical array
        prefix: Feature name prefix

    Returns:
        Dictionary of statistical features
    """
    if len(signal) == 0:
        return {}

    p = f"{prefix}_" if prefix else ""

    features = {
        f'{p}mean': float(np.mean(signal)),
        f'{p}std': float(np.std(signal)),
        f'{p}min': float(np.min(signal)),
        f'{p}max': float(np.max(signal)),
        f'{p}range': float(np.ptp(signal)),
        f'{p}median': float(np.median(signal)),
        f'{p}q25': float(np.percentile(signal, 25)),
        f'{p}q75': float(np.percentile(signal, 75)),
        f'{p}iqr': float(np.percentile(signal, 75) - np.percentile(signal, 25)),
        f'{p}skewness': float(scipy_stats.skew(signal)),
        f'{p}kurtosis': float(scipy_stats.kurtosis(signal)),
        f'{p}rms': float(np.sqrt(np.mean(signal ** 2))),
        f'{p}variance': float(np.var(signal)),
        f'{p}cv': float(np.std(signal) / np.mean(signal)) if np.mean(signal) != 0 else 0,
    }

    return features
