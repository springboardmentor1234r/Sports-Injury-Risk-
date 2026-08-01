"""
Range of Motion (ROM) analysis for each joint.

ROM measures the full movement potential of a joint. Reduced ROM
indicates stiffness, injury, or compensatory patterns.

Normal ROM values (degrees):
    Hip Flexion: 0-120°
    Hip Extension: 0-30°
    Knee Flexion: 0-135°
    Knee Extension: 0° (full)
    Ankle Dorsiflexion: 0-20°
    Ankle Plantarflexion: 0-50°
    Shoulder Flexion: 0-180°
    Shoulder Abduction: 0-180°
    Elbow Flexion: 0-145°
"""
import numpy as np
from typing import Dict, List, Optional
from dataclasses import dataclass


@dataclass
class ROMRange:
    """Normal range of motion for a joint movement."""
    joint: str
    movement: str
    min_degrees: float
    max_degrees: float
    unit: str = "degrees"


# Normal ROM reference values
NORMAL_ROM = {
    'hip_flexion': ROMRange('Hip', 'Flexion', 0, 120),
    'hip_extension': ROMRange('Hip', 'Extension', 0, 30),
    'knee_flexion': ROMRange('Knee', 'Flexion', 0, 135),
    'knee_extension': ROMRange('Knee', 'Extension', 0, 10),
    'ankle_dorsiflexion': ROMRange('Ankle', 'Dorsiflexion', 0, 20),
    'ankle_plantarflexion': ROMRange('Ankle', 'Plantarflexion', 0, 50),
    'shoulder_flexion': ROMRange('Shoulder', 'Flexion', 0, 180),
    'shoulder_abduction': ROMRange('Shoulder', 'Abduction', 0, 180),
    'shoulder_extension': ROMRange('Shoulder', 'Extension', 0, 60),
    'elbow_flexion': ROMRange('Elbow', 'Flexion', 0, 145),
    'elbow_extension': ROMRange('Elbow', 'Extension', 0, 10),
}


def calculate_rom(angle_series: np.ndarray) -> Dict[str, float]:
    """
    Calculate ROM from a time series of joint angles.

    ROM = max(angle) - min(angle) over the movement period.

    Args:
        angle_series: Array of joint angle measurements over time

    Returns:
        ROM metrics including range, min, max, and utilization percentage
    """
    if len(angle_series) == 0:
        return {'rom': 0, 'min_angle': 0, 'max_angle': 0}

    return {
        'rom': float(np.ptp(angle_series)),
        'min_angle': float(np.min(angle_series)),
        'max_angle': float(np.max(angle_series)),
        'mean_angle': float(np.mean(angle_series)),
        'std_angle': float(np.std(angle_series)),
    }


def rom_utilization(
    measured_rom: float,
    joint_movement: str
) -> Dict[str, float]:
    """
    Calculate how much of the normal ROM is being utilized.

    ROM Utilization = (measured_ROM / normal_ROM) × 100

    Args:
        measured_rom: Measured ROM in degrees
        joint_movement: Key from NORMAL_ROM dict

    Returns:
        Utilization percentage and risk assessment
    """
    if joint_movement not in NORMAL_ROM:
        return {'utilization': 0, 'risk': 'UNKNOWN'}

    normal = NORMAL_ROM[joint_movement]
    normal_range = normal.max_degrees - normal.min_degrees
    if normal_range == 0:
        return {'utilization': 100, 'risk': 'LOW'}

    utilization = (measured_rom / normal_range) * 100

    risk = 'LOW'
    if utilization < 50:
        risk = 'HIGH'
    elif utilization < 70:
        risk = 'MEDIUM'

    return {
        'measured_rom': measured_rom,
        'normal_rom': normal_range,
        'utilization_pct': float(utilization),
        'deficit_degrees': float(max(0, normal_range - measured_rom)),
        'risk': risk,
        'joint': normal.joint,
        'movement': normal.movement,
    }


def full_body_rom_assessment(
    joint_angles: Dict[str, np.ndarray]
) -> Dict[str, Dict]:
    """
    Comprehensive ROM assessment for all tracked joints.

    Args:
        joint_angles: Dict mapping joint names to angle time series

    Returns:
        Full ROM report for each joint
    """
    report = {}
    for joint_name, angles in joint_angles.items():
        rom = calculate_rom(angles)
        utilization = rom_utilization(rom['rom'], joint_name) if joint_name in NORMAL_ROM else {}
        report[joint_name] = {**rom, **utilization}

    return report
