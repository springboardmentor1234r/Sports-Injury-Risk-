from typing import Dict, Any

def calculate_balance_offset(landmarks_map: Dict[str, Dict[str, float]]) -> float:
    """
    Computes a balance displacement offset proxy using the horizontal offset 
    between the hip midpoint and ankle midpoint.
    """
    if not all(k in landmarks_map for k in ['LEFT_HIP', 'RIGHT_HIP', 'LEFT_ANKLE', 'RIGHT_ANKLE']):
        return 0.0
        
    # Hip Midpoint X
    hip_mid_x = (landmarks_map['LEFT_HIP']['x'] + landmarks_map['RIGHT_HIP']['x']) / 2.0
    # Ankle Midpoint X
    ankle_mid_x = (landmarks_map['LEFT_ANKLE']['x'] + landmarks_map['RIGHT_ANKLE']['x']) / 2.0
    
    # Calculate offset difference
    offset = hip_mid_x - ankle_mid_x
    return round(offset, 4)
