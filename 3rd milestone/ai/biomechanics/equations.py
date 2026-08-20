"""
Biomechanical Equations Reference Guide.
This module documents and implements the mathematical formulas used throughout the pipeline.

Formulas included:
1. Joint Angle (3D Vector Angle)
    \\theta = \\arccos\\left(\\frac{\\vec{a} \\cdot \\vec{b}}{|\\vec{a}| |\\vec{b}|}\\right)

2. Velocity (First Derivative)
    v(t) = \\frac{p(t) - p(t-1)}{\\Delta t}

3. Acceleration (Second Derivative)
    a(t) = \\frac{v(t) - v(t-1)}{\\Delta t}

4. Center of Mass
    CoM = \\frac{\\sum (m_i \\cdot p_i)}{\\sum m_i}

5. Force (Newton's Second Law)
    F = m \\cdot a

6. Symmetry Index
    SI = \\frac{2 \\times |L - R|}{L + R} \\times 100
"""
import numpy as np
from typing import Tuple

def calculate_angle_3d(p1: np.ndarray, p2: np.ndarray, p3: np.ndarray) -> float:
    """
    Calculate the 3D angle between three points.
    
    Formula:
        angle = arccos((a·b)/(|a||b|))
        
    Args:
        p1 (np.ndarray): Point 1 (e.g., Hip)
        p2 (np.ndarray): Point 2 (Vertex, e.g., Knee)
        p3 (np.ndarray): Point 3 (e.g., Ankle)
        
    Returns:
        float: Angle in degrees
    """
    v1 = p1 - p2
    v2 = p3 - p2
    cosine_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
    cosine_angle = np.clip(cosine_angle, -1.0, 1.0)
    angle = np.degrees(np.arccos(cosine_angle))
    return float(angle)

def calculate_velocity(p_t0: np.ndarray, p_t1: np.ndarray, dt: float) -> np.ndarray:
    """
    Calculate velocity (first derivative of position).
    Formula: v = (p_t1 - p_t0) / dt
    """
    return (p_t1 - p_t0) / dt

def calculate_symmetry_index(left_val: float, right_val: float) -> float:
    """
    Calculate Left-Right Symmetry Index.
    Formula: SI = (2 * |L - R|) / (L + R) * 100
    """
    if left_val + right_val == 0:
        return 0.0
    return (2 * abs(left_val - right_val) / (left_val + right_val)) * 100
