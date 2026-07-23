import math
from typing import Dict, Any, List

def calculate_step_separation(landmarks_map: Dict[str, Dict[str, float]]) -> float:
    """
    Measures the instant horizontal foot separation distance (normalized) between ankles.
    """
    if 'LEFT_ANKLE' not in landmarks_map or 'RIGHT_ANKLE' not in landmarks_map:
        return 0.0
        
    dx = landmarks_map['LEFT_ANKLE']['x'] - landmarks_map['RIGHT_ANKLE']['x']
    # Return absolute horizontal distance
    return round(abs(dx), 4)

def calculate_peak_stride(frames_landmarks: List[List[Dict[str, Any]]]) -> float:
    """
    Identifies maximum stride length extension by finding the peak ankle separation across frames.
    """
    peak_stride = 0.0
    for frame_lms in frames_landmarks:
        lms_map = {lm['name']: lm for lm in frame_lms}
        separation = calculate_step_separation(lms_map)
        if separation > peak_stride:
            peak_stride = separation
            
    return round(peak_stride, 4)
