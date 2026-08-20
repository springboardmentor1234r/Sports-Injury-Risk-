"""
Synthetic Data Generator for Biomechanical AI Pipeline.
Generates realistic training data for demonstration and testing.
"""
import numpy as np
import pandas as pd
from typing import Tuple

def generate_synthetic_data(n_samples: int = 1000) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Generate synthetic biomechanical features and injury risk labels.
    """
    np.random.seed(42)
    
    # Generate Features
    # 1. Knee Valgus Angle (Degrees)
    knee_valgus = np.random.normal(loc=8, scale=5, size=n_samples)
    
    # 2. Symmetry Index (%)
    symmetry_index = np.random.normal(loc=5, scale=4, size=n_samples)
    
    # 3. Ground Reaction Force (Normalized to Body Weight)
    grf = np.random.normal(loc=1.5, scale=0.4, size=n_samples)
    
    # 4. Joint Angular Velocity (deg/s)
    angular_velocity = np.random.normal(loc=300, scale=50, size=n_samples)
    
    df = pd.DataFrame({
        "knee_valgus": knee_valgus,
        "symmetry_index": symmetry_index,
        "grf": grf,
        "angular_velocity": angular_velocity
    })
    
    # Generate Labels based on rules
    # 0: LOW, 1: MEDIUM, 2: HIGH, 3: CRITICAL
    labels = np.zeros(n_samples, dtype=int)
    
    for i in range(n_samples):
        score = 0
        if df.loc[i, "knee_valgus"] > 15: score += 2
        elif df.loc[i, "knee_valgus"] > 10: score += 1
        
        if df.loc[i, "symmetry_index"] > 15: score += 2
        elif df.loc[i, "symmetry_index"] > 10: score += 1
        
        if df.loc[i, "grf"] > 2.5: score += 1
        
        # Map score to label (0-3)
        labels[i] = min(score, 3)
        
    return df, pd.Series(labels, name="risk_level")

if __name__ == "__main__":
    X, y = generate_synthetic_data(100)
    print("Generated synthetic data.")
    print(X.head())
    print(y.head())
