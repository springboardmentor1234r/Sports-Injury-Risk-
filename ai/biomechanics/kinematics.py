"""
Kinematics Module.
Calculates velocities, accelerations, and center of mass.
"""
import numpy as np
from typing import Dict, List, Optional
from f.sport.ai.biomechanics.equations import calculate_velocity

# Typical segment mass percentages (Dempster data)
SEGMENT_MASS_PCT = {
    "head": 0.081,
    "trunk": 0.497,
    "upper_arm": 0.028, # per side
    "forearm": 0.016, # per side
    "hand": 0.006, # per side
    "thigh": 0.1, # per side
    "calf": 0.0465, # per side
    "foot": 0.0145 # per side
}

def get_center_of_mass(landmarks: Dict[str, np.ndarray]) -> Optional[np.ndarray]:
    """
    Calculate Center of Mass (CoM).
    Formula: CoM = sum(m_i * p_i) / sum(m_i)
    """
    com = np.zeros(3)
    total_mass = 0.0
    
    # Simplified CoM using available landmarks
    # Assumes uniform density between joints
    segments = {
        "trunk": (landmarks.get("left_shoulder", np.zeros(3)) + landmarks.get("right_hip", np.zeros(3))) / 2,
        "left_thigh": (landmarks.get("left_hip", np.zeros(3)) + landmarks.get("left_knee", np.zeros(3))) / 2,
        "right_thigh": (landmarks.get("right_hip", np.zeros(3)) + landmarks.get("right_knee", np.zeros(3))) / 2,
    }
    
    mass_map = {
        "trunk": SEGMENT_MASS_PCT["trunk"],
        "left_thigh": SEGMENT_MASS_PCT["thigh"],
        "right_thigh": SEGMENT_MASS_PCT["thigh"]
    }
    
    for name, pos in segments.items():
        if np.any(pos):
            mass = mass_map[name]
            com += pos * mass
            total_mass += mass
            
    return com / total_mass if total_mass > 0 else None

def get_angular_velocity(angle_t0: float, angle_t1: float, dt: float) -> float:
    """
    Calculate Angular Velocity.
    Formula: omega = (theta_t1 - theta_t0) / dt
    Units: deg/s
    """
    return (angle_t1 - angle_t0) / dt

def get_angular_acceleration(omega_t0: float, omega_t1: float, dt: float) -> float:
    """
    Calculate Angular Acceleration.
    Formula: alpha = (omega_t1 - omega_t0) / dt
    Units: deg/s^2
    """
    return (omega_t1 - omega_t0) / dt
