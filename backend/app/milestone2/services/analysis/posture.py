import math
from typing import Dict, Any

def calculate_tilt_angle(p1: Dict[str, float], p2: Dict[str, float]) -> float:
    """
    Calculate the angle (in degrees) of the line p1->p2 relative to horizontal.
    """
    dx = p2['x'] - p1['x']
    dy = p2['y'] - p1['y']
    
    if dx == 0:
        return 90.0
        
    angle_rad = math.atan2(dy, dx)
    return round(math.degrees(angle_rad), 2)

def calculate_trunk_lean(landmarks_map: Dict[str, Dict[str, float]]) -> float:
    """
    Calculate trunk lean angle (shoulders midpoint to hips midpoint relative to vertical line).
    """
    if not all(k in landmarks_map for k in ['LEFT_SHOULDER', 'RIGHT_SHOULDER', 'LEFT_HIP', 'RIGHT_HIP']):
        return 0.0
        
    sh_mid_x = (landmarks_map['LEFT_SHOULDER']['x'] + landmarks_map['RIGHT_SHOULDER']['x']) / 2.0
    sh_mid_y = (landmarks_map['LEFT_SHOULDER']['y'] + landmarks_map['RIGHT_SHOULDER']['y']) / 2.0
    
    hip_mid_x = (landmarks_map['LEFT_HIP']['x'] + landmarks_map['RIGHT_HIP']['x']) / 2.0
    hip_mid_y = (landmarks_map['LEFT_HIP']['y'] + landmarks_map['RIGHT_HIP']['y']) / 2.0
    
    dx = sh_mid_x - hip_mid_x
    dy = sh_mid_y - hip_mid_y
    
    if dy == 0:
        return 90.0
        
    # Angle relative to vertical axis
    angle_rad = math.atan2(dx, abs(dy))
    return round(abs(math.degrees(angle_rad)), 2)

def compute_posture_metrics(landmarks_map: Dict[str, Dict[str, float]]) -> Dict[str, float]:
    """
    Calculate posture deviations (shoulder/hip tilt & trunk lean).
    """
    metrics = {
        "shoulder_tilt": 0.0,
        "hip_tilt": 0.0,
        "trunk_lean": 0.0
    }
    
    if 'LEFT_SHOULDER' in landmarks_map and 'RIGHT_SHOULDER' in landmarks_map:
        metrics['shoulder_tilt'] = calculate_tilt_angle(
            landmarks_map['LEFT_SHOULDER'], landmarks_map['RIGHT_SHOULDER']
        )
        
    if 'LEFT_HIP' in landmarks_map and 'RIGHT_HIP' in landmarks_map:
        metrics['hip_tilt'] = calculate_tilt_angle(
            landmarks_map['LEFT_HIP'], landmarks_map['RIGHT_HIP']
        )
        
    metrics['trunk_lean'] = calculate_trunk_lean(landmarks_map)
    
    return metrics
