from fastapi import FastAPI, UploadFile, File
from fastapi.responses import StreamingResponse
import cv2
import numpy as np
import io
from PIL import Image
import math

import mediapipe.python.solutions.pose as mp_pose
import mediapipe.python.solutions.drawing_utils as mp_drawing
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MediaPipe Pose model
pose = mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.5)

def calculate_angle(a, b, c):
    """
    Calculate the angle between three joints (e.g., hip, knee, ankle).
    """
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)
    
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    
    if angle > 180.0:
        angle = 360.0 - angle
        
    return round(angle, 2)

@app.post("/upload-image/")
async def analyze_pose(file: UploadFile = File(...)):
    # Read the uploaded image
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    
    # Convert PIL Image to NumPy Array
    image_np = np.array(image)

    # Process the image using MediaPipe (requires RGB format)
    results = pose.process(image_np)

    if results.pose_landmarks:
        # 1. Draw skeleton landmarks and connections on the image
        mp_drawing.draw_landmarks(
            image_np, 
            results.pose_landmarks, 
            mp_pose.POSE_CONNECTIONS,
            mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2), # Green points for joints
            mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=2, circle_radius=2)  # Red lines for skeleton
        )

        landmarks = results.pose_landmarks.landmark
        
        # 2. Extract coordinates for Left Hip, Left Knee, and Left Ankle
        left_hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x, landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
        left_knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
        left_ankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
        
        # 3. Calculate the knee angle
        knee_angle = calculate_angle(left_hip, left_knee, left_ankle)

        # 4. Display the calculated angle on the image near the knee
        h, w, c = image_np.shape
        knee_pos = tuple(np.multiply(left_knee, [w, h]).astype(int))
        cv2.putText(image_np, f"{knee_angle} deg", knee_pos, cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)

        # 5. Convert image back to BGR for proper rendering and encode to PNG
        image_bgr = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
        _, encoded_image = cv2.imencode('.png', image_bgr)
        
        # Return the processed image directly to the frontend
        return StreamingResponse(io.BytesIO(encoded_image.tobytes()), media_type="image/png")
    else:
        return {"message": "No human pose detected in the provided image.", "status": "Failed"}