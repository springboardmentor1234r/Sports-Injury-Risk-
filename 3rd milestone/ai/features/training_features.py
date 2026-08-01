"""
Training load and fatigue features for injury risk assessment.
"""
import numpy as np
from typing import Dict, Optional


def acute_chronic_workload_ratio(
    daily_loads: np.ndarray,
    acute_days: int = 7,
    chronic_days: int = 28
) -> float:
    """
    Calculate Acute:Chronic Workload Ratio (ACWR).

    ACWR = acute_load / chronic_load

    Risk zones:
        < 0.8: Under-training (moderate risk)
        0.8-1.3: Sweet spot (low risk)
        > 1.5: Spike (high risk)
    """
    if len(daily_loads) < chronic_days:
        return 1.0

    acute_load = np.mean(daily_loads[-acute_days:])
    chronic_load = np.mean(daily_loads[-chronic_days:])
    return float(acute_load / chronic_load) if chronic_load > 0 else 1.0


def training_monotony(daily_loads: np.ndarray, window: int = 7) -> float:
    """
    Training Monotony = mean(weekly_load) / std(weekly_load)

    High monotony (> 2.0) increases injury risk.
    """
    if len(daily_loads) < window:
        return 0.0
    recent = daily_loads[-window:]
    std = np.std(recent)
    return float(np.mean(recent) / std) if std > 0 else 0.0


def training_strain(daily_loads: np.ndarray, window: int = 7) -> float:
    """Training Strain = weekly_load × monotony"""
    monotony = training_monotony(daily_loads, window)
    weekly_load = np.sum(daily_loads[-window:]) if len(daily_loads) >= window else np.sum(daily_loads)
    return float(weekly_load * monotony)


def fatigue_index(
    recent_loads: np.ndarray,
    rest_hours: float,
    sleep_quality: float = 0.7
) -> float:
    """
    Estimate fatigue index (0-100, 100 = extreme fatigue).

    Considers training load, rest, and sleep quality.
    """
    load_factor = min(1.0, np.mean(recent_loads) / 100) if len(recent_loads) > 0 else 0
    rest_factor = max(0, 1 - rest_hours / 48)
    sleep_factor = 1 - sleep_quality

    fatigue = (load_factor * 0.5 + rest_factor * 0.3 + sleep_factor * 0.2) * 100
    return float(min(100, max(0, fatigue)))


def extract_training_features(
    daily_loads: np.ndarray,
    rest_hours: float = 24,
    sleep_quality: float = 0.7,
) -> Dict[str, float]:
    """Extract all training-related features."""
    return {
        'acwr': acute_chronic_workload_ratio(daily_loads),
        'training_monotony': training_monotony(daily_loads),
        'training_strain': training_strain(daily_loads),
        'fatigue_index': fatigue_index(daily_loads[-7:] if len(daily_loads) >= 7 else daily_loads, rest_hours, sleep_quality),
        'weekly_load': float(np.sum(daily_loads[-7:])) if len(daily_loads) >= 7 else float(np.sum(daily_loads)),
        'load_trend': float(np.polyfit(np.arange(min(14, len(daily_loads))), daily_loads[-14:] if len(daily_loads) >= 14 else daily_loads, 1)[0]),
    }
