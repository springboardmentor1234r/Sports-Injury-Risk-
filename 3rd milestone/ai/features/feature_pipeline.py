"""
Feature Pipeline.
Extracts and normalizes features.
"""
import pandas as pd
from typing import Dict, Any

def extract_features(biomechanics_data: Dict[str, Any]) -> pd.DataFrame:
    """Extract features from biomechanics data."""
    # Simplified extraction for demonstration
    landing = biomechanics_data.get("landing", {})
    angles = biomechanics_data.get("angles", {})
    
    features = {
        "knee_valgus": landing.get("left_valgus", 0.0),
        "hip_angle": angles.get("left_hip", 0.0),
        "symmetry_index": 5.0,
        "grf": 1.5,
        "angular_velocity": 300.0
    }
    
    return pd.DataFrame([features])
