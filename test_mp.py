import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# Dummy image
frame = np.zeros((480, 640, 3), dtype=np.uint8)

# Initialize landmarker
base_options = python.BaseOptions(model_asset_path='models/pose_landmarker_full.task')
options = vision.PoseLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.IMAGE)

with vision.PoseLandmarker.create_from_options(options) as detector:
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame)
    detection_result = detector.detect(mp_image)
    
    if detection_result.pose_landmarks:
        # Try to draw
        from mediapipe.framework.formats import landmark_pb2
        landmarks_proto = landmark_pb2.NormalizedLandmarkList()
        landmarks_proto.landmark.extend([
            landmark_pb2.NormalizedLandmark(x=landmark.x, y=landmark.y, z=landmark.z)
            for landmark in detection_result.pose_landmarks[0]
        ])
        vision.drawing_utils.draw_landmarks(
            frame,
            landmarks_proto,
            vision.PoseLandmarksConnections.POSE_CONNECTIONS,
            vision.drawing_styles.get_default_pose_landmarks_style()
        )
print("success")
