"""
Joint Angles Module.
Calculates key joint angles for biomechanical analysis.

Includes:
- Hip, Knee, Ankle, Shoulder, Elbow angles
- Formula: angle = arccos((a·b)/(|a||b|))
"""
import numpy as np
from typing import Dict, Optional
from f.sport.ai.biomechanics.equations import calculate_angle_3d

def get_hip_angle(shoulder: np.ndarray, hip: np.ndarray, knee: np.ndarray) -> float:
    """
    Calculate Hip Angle.
    Points: Shoulder -> Hip -> Knee
    Normal Range: 0-120 degrees
    """
    return calculate_angle_3d(shoulder, hip, knee)

def get_knee_angle(hip: np.ndarray, knee: np.ndarray, ankle: np.ndarray) -> float:
    """
    Calculate Knee Angle.
    Points: Hip -> Knee -> Ankle
    Normal Range: 0-150 degrees (0 = full extension)
    """
    return calculate_angle_3d(hip, knee, ankle)

def get_ankle_angle(knee: np.ndarray, ankle: np.ndarray, foot: np.ndarray) -> float:
    """
    Calculate Ankle Angle.
    Points: Knee -> Ankle -> Foot Index
    Normal Range: 90-130 degrees
    """
    return calculate_angle_3d(knee, ankle, foot)

def get_shoulder_angle(hip: np.ndarray, shoulder: np.ndarray, elbow: np.ndarray) -> float:
    """
    Calculate Shoulder Angle.
    Points: Hip -> Shoulder -> Elbow
    Normal Range: 0-180 degrees
    """
    return calculate_angle_3d(hip, shoulder, elbow)

def get_elbow_angle(shoulder: np.ndarray, elbow: np.ndarray, wrist: np.ndarray) -> float:
    """
    Calculate Elbow Angle.
    Points: Shoulder -> Elbow -> Wrist
    Normal Range: 0-150 degrees
    """
    return calculate_angle_3d(shoulder, elbow, wrist)

def compute_all_joint_angles(landmarks: Dict[str, np.ndarray]) -> Dict[str, float]:
    """
    Compute all joint angles from a dictionary of 3D landmarks.
    Requires at least: shoulder, hip, knee, ankle, foot, elbow, wrist for both sides.
    """
    angles = {}
    
    # Left side
    if all(k in landmarks for k in ["left_shoulder", "left_hip", "left_knee"]):
        angles["left_hip"] = get_hip_angle(landmarks["left_shoulder"], landmarks["left_hip"], landmarks["left_knee"])
    if all(k in landmarks for k in ["left_hip", "left_knee", "left_ankle"]):
        angles["left_knee"] = get_knee_angle(landmarks["left_hip"], landmarks["left_knee"], landmarks["left_ankle"])
    if all(k in landmarks for k in ["left_knee", "left_ankle", "left_foot_index"]):
        angles["left_ankle"] = get_ankle_angle(landmarks["left_knee"], landmarks["left_ankle"], landmarks["left_foot_index"])
    if all(k in landmarks for k in ["left_hip", "left_shoulder", "left_elbow"]):
        angles["left_shoulder"] = get_shoulder_angle(landmarks["left_hip"], landmarks["left_shoulder"], landmarks["left_elbow"])
    if all(k in landmarks for k in ["left_shoulder", "left_elbow", "left_wrist"]):
        angles["left_elbow"] = get_elbow_angle(landmarks["left_shoulder"], landmarks["left_elbow"], landmarks["left_wrist"])
        
    # Right side
    if all(k in landmarks for k in ["right_shoulder", "right_hip", "right_knee"]):
        angles["right_hip"] = get_hip_angle(landmarks["right_shoulder"], landmarks["right_hip"], landmarks["right_knee"])
    if all(k in landmarks for k in ["right_hip", "right_knee", "right_ankle"]):
        angles["right_knee"] = get_knee_angle(landmarks["right_hip"], landmarks["right_knee"], landmarks["right_ankle"])
    if all(k in landmarks for k in ["right_knee", "right_ankle", "right_foot_index"]):
        angles["right_ankle"] = get_ankle_angle(landmarks["right_knee"], landmarks["right_ankle"], landmarks["right_foot_index"])
    if all(k in landmarks for k in ["right_hip", "right_shoulder", "right_elbow"]):
        angles["right_shoulder"] = get_shoulder_angle(landmarks["right_hip"], landmarks["right_shoulder"], landmarks["right_elbow"])
    if all(k in landmarks for k in ["right_shoulder", "right_elbow", "right_wrist"]):
        angles["right_elbow"] = get_elbow_angle(landmarks["right_shoulder"], landmarks["right_elbow"], landmarks["right_wrist"])
        
    return angles
