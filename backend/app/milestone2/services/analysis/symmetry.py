from typing import Dict, Any

def calculate_symmetry_index(left_val: float, right_val: float) -> float:
    """
    Computes a percentage-based symmetry score between two corresponding left and right values.
    """
    if left_val == 0.0 and right_val == 0.0:
        return 100.0
        
    denom = max(1.0, left_val, right_val)
    diff = abs(left_val - right_val)
    
    # Calculate symmetry ratio percentage (100% = perfectly symmetrical)
    ratio = (1.0 - (diff / denom)) * 100.0
    return round(max(0.0, ratio), 2)

def evaluate_frame_symmetry(joint_angles: Dict[str, float]) -> float:
    """
    Compare left vs right knee flexion symmetry for the current frame.
    """
    left_knee = joint_angles.get('knee_flexion_left', 0.0)
    right_knee = joint_angles.get('knee_flexion_right', 0.0)
    
    return calculate_symmetry_index(left_knee, right_knee)
