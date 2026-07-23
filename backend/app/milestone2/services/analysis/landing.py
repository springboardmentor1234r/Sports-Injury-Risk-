from typing import Dict, List, Any, Optional

def detect_landing_impact_frame(frames_landmarks: List[List[Dict[str, Any]]]) -> int:
    """
    Scans frame coordinates to locate the touchdown frame.
    Touchdown is estimated as the frame where the hip midpoint reaches its local vertical minimum 
    (maximum Y coordinate in MediaPipe's top-down layout).
    """
    if not frames_landmarks:
        return 0
        
    peak_y = -1.0
    impact_frame_idx = 0
    
    for idx, frame_lms in enumerate(frames_landmarks):
        # Create map
        lms_map = {lm['name']: lm for lm in frame_lms}
        if 'LEFT_HIP' in lms_map and 'RIGHT_HIP' in lms_map:
            # MediaPipe Y coordinate increases downwards
            hip_y = (lms_map['LEFT_HIP']['y'] + lms_map['RIGHT_HIP']['y']) / 2.0
            if hip_y > peak_y:
                peak_y = hip_y
                impact_frame_idx = idx
                
    return impact_frame_idx

def calculate_landing_flexion(
    frame_angles: Dict[str, float]
) -> float:
    """
    Fetch knee flexion angle on landing impact.
    """
    left_knee = frame_angles.get('knee_flexion_left', 0.0)
    right_knee = frame_angles.get('knee_flexion_right', 0.0)
    # Return average knee flexion at landing
    return round((left_knee + right_knee) / 2.0, 2)
