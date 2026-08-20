import math
from typing import Dict, Any, List

def calculate_angle_3d(a: Dict[str, float], b: Dict[str, float], c: Dict[str, float]) -> float:
    """
    Calculate the 3D angle (in degrees) between vectors BA and BC, with B as the vertex.
    """
    # Vectors BA and BC
    ba = [a['x'] - b['x'], a['y'] - b['y'], a['z'] - b['z']]
    bc = [c['x'] - b['x'], c['y'] - b['y'], c['z'] - b['z']]
    
    # Dot product
    dot_prod = ba[0]*bc[0] + ba[1]*bc[1] + ba[2]*bc[2]
    
    # Magnitudes
    mag_ba = math.sqrt(ba[0]**2 + ba[1]**2 + ba[2]**2)
    mag_bc = math.sqrt(bc[0]**2 + bc[1]**2 + bc[2]**2)
    
    if mag_ba == 0 or mag_bc == 0:
        return 0.0
        
    cos_angle = dot_prod / (mag_ba * mag_bc)
    # Handle floating point inaccuracies
    cos_angle = max(-1.0, min(1.0, cos_angle))
    
    angle_rad = math.acos(cos_angle)
    return round(math.degrees(angle_rad), 2)

def calculate_valgus_deviation(hip: Dict[str, float], knee: Dict[str, float], ankle: Dict[str, float]) -> float:
    """
    Calculate knee valgus angle deviation (how much the knee caves inward relative to the hip-ankle line).
    Represented as the difference between 180 degrees (perfect line) and the joint angle.
    """
    angle = calculate_angle_3d(hip, knee, ankle)
    deviation = 180.0 - angle
    return round(abs(deviation), 2)

def compute_frame_angles(landmarks_map: Dict[str, Dict[str, float]]) -> Dict[str, float]:
    """
    Orchestrate angles calculations for the current frame.
    """
    angles = {}
    
    # 1. Knee Flexion (Hip -> Knee -> Ankle)
    if 'LEFT_HIP' in landmarks_map and 'LEFT_KNEE' in landmarks_map and 'LEFT_ANKLE' in landmarks_map:
        angles['knee_flexion_left'] = calculate_angle_3d(
            landmarks_map['LEFT_HIP'], landmarks_map['LEFT_KNEE'], landmarks_map['LEFT_ANKLE']
        )
    if 'RIGHT_HIP' in landmarks_map and 'RIGHT_KNEE' in landmarks_map and 'RIGHT_ANKLE' in landmarks_map:
        angles['knee_flexion_right'] = calculate_angle_3d(
            landmarks_map['RIGHT_HIP'], landmarks_map['RIGHT_KNEE'], landmarks_map['RIGHT_ANKLE']
        )
        
    # 2. Knee Valgus Deviation
    if 'LEFT_HIP' in landmarks_map and 'LEFT_KNEE' in landmarks_map and 'LEFT_ANKLE' in landmarks_map:
        angles['knee_valgus_left'] = calculate_valgus_deviation(
            landmarks_map['LEFT_HIP'], landmarks_map['LEFT_KNEE'], landmarks_map['LEFT_ANKLE']
        )
    if 'RIGHT_HIP' in landmarks_map and 'RIGHT_KNEE' in landmarks_map and 'RIGHT_ANKLE' in landmarks_map:
        angles['knee_valgus_right'] = calculate_valgus_deviation(
            landmarks_map['RIGHT_HIP'], landmarks_map['RIGHT_KNEE'], landmarks_map['RIGHT_ANKLE']
        )
        
    # 3. Hip Flexion (Shoulder -> Hip -> Knee)
    if 'LEFT_SHOULDER' in landmarks_map and 'LEFT_HIP' in landmarks_map and 'LEFT_KNEE' in landmarks_map:
        angles['hip_flexion_left'] = calculate_angle_3d(
            landmarks_map['LEFT_SHOULDER'], landmarks_map['LEFT_HIP'], landmarks_map['LEFT_KNEE']
        )
    if 'RIGHT_SHOULDER' in landmarks_map and 'RIGHT_HIP' in landmarks_map and 'RIGHT_KNEE' in landmarks_map:
        angles['hip_flexion_right'] = calculate_angle_3d(
            landmarks_map['RIGHT_SHOULDER'], landmarks_map['RIGHT_HIP'], landmarks_map['RIGHT_KNEE']
        )
        
    return angles
