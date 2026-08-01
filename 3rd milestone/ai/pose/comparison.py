"""
Pose estimation model comparison report.

Compares MediaPipe, MoveNet, OpenPose, and Detectron2 across
accuracy, speed, landmark count, and use-case suitability.

Conclusion: MediaPipe Pose is selected for this project.
"""

COMPARISON = {
    'models': [
        {
            'name': 'MediaPipe Pose',
            'provider': 'Google',
            'landmarks': 33,
            'dimensions': '3D (x, y, z)',
            'speed_fps': '30+ (real-time)',
            'accuracy': 'High',
            'browser_support': True,
            'mobile_support': True,
            'multi_person': False,
            'license': 'Apache 2.0',
            'pros': [
                '33 landmarks — most comprehensive',
                '3D coordinates (z-depth)',
                'Real-time performance',
                'Browser and mobile support',
                'Easy to integrate (pip install mediapipe)',
                'Well-documented API',
            ],
            'cons': [
                'Single person only (need YOLO for multi-person)',
                'Less accurate on occluded joints',
                'Requires good lighting',
            ],
            'selected': True,
            'selection_reason': 'Best balance of landmark count (33), 3D support, speed, and ease of integration.',
        },
        {
            'name': 'MoveNet',
            'provider': 'Google (TensorFlow Hub)',
            'landmarks': 17,
            'dimensions': '2D (x, y)',
            'speed_fps': '30+ (Lightning) / 15 (Thunder)',
            'accuracy': 'High',
            'browser_support': True,
            'mobile_support': True,
            'multi_person': True,
            'license': 'Apache 2.0',
            'pros': ['Very fast', 'Multi-person support', 'TF.js support'],
            'cons': ['Only 17 keypoints', 'No 3D coordinates', 'Missing hand/face landmarks'],
            'selected': False,
            'selection_reason': 'Good speed but only 17 landmarks insufficient for detailed biomechanics.',
        },
        {
            'name': 'OpenPose',
            'provider': 'CMU',
            'landmarks': 25,
            'dimensions': '2D (optional 3D)',
            'speed_fps': '8-15',
            'accuracy': 'Very High',
            'browser_support': False,
            'mobile_support': False,
            'multi_person': True,
            'license': 'Non-commercial',
            'pros': ['Very accurate', 'Multi-person', 'Hand + face support'],
            'cons': ['Slow', 'GPU required', 'Non-commercial license', 'Complex setup'],
            'selected': False,
            'selection_reason': 'Too slow for real-time and restrictive license.',
        },
        {
            'name': 'Detectron2 (Keypoint R-CNN)',
            'provider': 'Meta/FAIR',
            'landmarks': 17,
            'dimensions': '2D',
            'speed_fps': '5-10',
            'accuracy': 'Very High',
            'browser_support': False,
            'mobile_support': False,
            'multi_person': True,
            'license': 'Apache 2.0',
            'pros': ['State-of-the-art accuracy', 'Multi-person', 'Instance segmentation'],
            'cons': ['Very slow', 'Heavy GPU requirements', 'Complex setup', 'Only 17 keypoints'],
            'selected': False,
            'selection_reason': 'Best accuracy but too slow and only 17 keypoints.',
        },
    ],
    'recommendation': 'MediaPipe Pose',
    'rationale': (
        'MediaPipe Pose offers the best combination of features for our sports injury '
        'detection use case: 33 body landmarks (vs 17 for others), 3D coordinate support, '
        'real-time performance (30+ FPS), and easy deployment. For multi-person scenarios, '
        'we first detect individuals with YOLOv11, then run MediaPipe on each detected person.'
    ),
}


def get_comparison_report() -> dict:
    """Return the full model comparison report."""
    return COMPARISON


def print_comparison_table():
    """Print a formatted comparison table."""
    print(f"{'Model':<20} {'Landmarks':<12} {'Speed':<15} {'3D':<5} {'Multi':<7} {'Selected'}")
    print("-" * 80)
    for m in COMPARISON['models']:
        sel = '✅' if m['selected'] else '❌'
        print(f"{m['name']:<20} {m['landmarks']:<12} {m['speed_fps']:<15} "
              f"{'Yes' if '3D' in m['dimensions'] else 'No':<5} "
              f"{'Yes' if m['multi_person'] else 'No':<7} {sel}")
