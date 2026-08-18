"""
Biomechanical feature aggregation from analysis results.
"""
import numpy as np
from typing import Dict


def extract_biomechanical_features(analysis_results: Dict) -> Dict[str, float]:
    """
    Aggregate all biomechanical measurements into a feature vector.

    Combines joint angles, kinematics, dynamics, symmetry, and balance
    into a single feature dictionary for the prediction model.
    """
    features = {}

    # Joint angle features
    for joint in ['hip', 'knee', 'shoulder', 'ankle', 'elbow']:
        for side in ['left', 'right']:
            key = f'{joint}_{side}'
            if key in analysis_results:
                features[f'{key}_angle'] = analysis_results[key]

    # Kinematic features
    for metric in ['velocity', 'acceleration', 'angular_velocity', 'stride_length',
                    'step_width', 'cadence', 'ground_contact_time']:
        if metric in analysis_results:
            features[metric] = analysis_results[metric]

    # Symmetry features
    if 'symmetry_index' in analysis_results:
        features['symmetry_index'] = analysis_results['symmetry_index']

    # Landing mechanics
    for metric in ['knee_valgus', 'trunk_lean', 'hip_stability']:
        if metric in analysis_results:
            features[metric] = analysis_results[metric]

    # Balance
    if 'stability_index' in analysis_results:
        features['stability_index'] = analysis_results['stability_index']

    return features
