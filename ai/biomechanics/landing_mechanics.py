"""
Landing Mechanics Module.
Analyzes landing patterns for injury risk detection, particularly ACL risk.
"""
import numpy as np
from typing import Dict
from f.sport.ai.biomechanics.joint_angles import get_knee_angle, get_hip_angle
from f.sport.ai.biomechanics.equations import calculate_angle_3d

def check_knee_valgus(hip: np.ndarray, knee: np.ndarray, ankle: np.ndarray) -> float:
    """
    Detect Dynamic Knee Valgus Angle (Frontal Plane).
    A high valgus angle during landing is a major predictor of ACL injury.
    
    Formula: Uses 3D angle but projected to frontal plane (x, y coordinates).
    Normal Range: < 10 degrees. Critical if > 15 degrees.
    """
    # Project to frontal plane by zeroing Z
    hip_f = np.array([hip[0], hip[1], 0])
    knee_f = np.array([knee[0], knee[1], 0])
    ankle_f = np.array([ankle[0], ankle[1], 0])
    
    return calculate_angle_3d(hip_f, knee_f, ankle_f)

def assess_trunk_lean(shoulder_center: np.ndarray, hip_center: np.ndarray, vertical_ref: np.ndarray) -> float:
    """
    Calculate Trunk Lean Angle.
    Forward trunk lean reduces ACL loading.
    
    Formula: Angle between trunk vector and vertical reference.
    """
    trunk_vector = shoulder_center - hip_center
    vertical_vector = vertical_ref - hip_center
    return calculate_angle_3d(shoulder_center, hip_center, vertical_ref)

def assess_landing_risk(landmarks: Dict[str, np.ndarray]) -> Dict[str, float]:
    """
    Comprehensive landing risk assessment.
    """
    risk_factors = {}
    
    if all(k in landmarks for k in ["left_hip", "left_knee", "left_ankle"]):
        risk_factors["left_valgus"] = check_knee_valgus(
            landmarks["left_hip"], landmarks["left_knee"], landmarks["left_ankle"])
            
    if all(k in landmarks for k in ["right_hip", "right_knee", "right_ankle"]):
        risk_factors["right_valgus"] = check_knee_valgus(
            landmarks["right_hip"], landmarks["right_knee"], landmarks["right_ankle"])
            
    return risk_factors
