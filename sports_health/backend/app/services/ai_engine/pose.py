import cv2
import os

# Use explicit submodule imports to bypass the 'solutions' error
try:
    import mediapipe as mp
    from mediapipe.python.solutions import pose as mp_pose
except ImportError:
    import mediapipe as mp
    # Fallback for some installations
    mp_pose = mp.solutions.pose

# Initialize the engine
pose_engine = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

async def process_video_pose(file_path: str):
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Video file not found: {file_path}")

    cap = cv2.VideoCapture(file_path)
    if not cap.isOpened():
        return []

    all_frames_data = []
    frame_count = 0
    
    print(f"--- AI START: Processing {file_path} ---")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose_engine.process(frame_rgb)

        if results.pose_landmarks:
            landmarks = {}
            for i, landmark in enumerate(results.pose_landmarks.landmark):
                landmarks[f"point_{i}"] = {
                    "x": round(float(landmark.x), 4),
                    "y": round(float(landmark.y), 4),
                    "z": round(float(landmark.z), 4),
                    "v": round(float(landmark.visibility), 4)
                }
            
            all_frames_data.append({
                "frame": frame_count,
                "landmarks": landmarks
            })
        
        frame_count += 1
        if frame_count % 50 == 0:
            print(f"AI Progress: {frame_count} frames analyzed...")

    cap.release()
    print(f"--- AI COMPLETE: Found landmarks in {len(all_frames_data)} frames ---")
    return all_frames_data