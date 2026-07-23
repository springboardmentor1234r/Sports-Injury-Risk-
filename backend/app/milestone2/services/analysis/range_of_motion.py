from typing import Dict, List, Any

def compute_progressive_rom(
    historical_angles: List[Dict[str, float]], 
    current_angles: Dict[str, float]
) -> Dict[str, Dict[str, float]]:
    """
    Computes progressive Range of Motion (ROM) metrics including min, max, and current values.
    """
    rom = {}
    
    # Combine history with current
    all_angles = historical_angles + [current_angles]
    
    # Identify all tracked angle keys
    angle_keys = set()
    for entry in all_angles:
        angle_keys.update(entry.keys())
        
    for key in angle_keys:
        values = [entry[key] for entry in all_angles if key in entry]
        if values:
            rom[key] = {
                "min": float(min(values)),
                "max": float(max(values)),
                "current": float(current_angles.get(key, values[-1]))
            }
            
    return rom
