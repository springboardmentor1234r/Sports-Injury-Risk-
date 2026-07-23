import os
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import asyncio
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

# Dynamically load third-party requirements
try:
    import cv2
    import numpy as np
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False

# Configuration variables from environment or default fallbacks
MODEL_COMPLEXITY = int(os.getenv("MEDIAPIPE_MODEL_COMPLEXITY", "1"))
MIN_DETECTION_CONFIDENCE = float(os.getenv("MEDIAPIPE_DETECTION_CONFIDENCE", "0.5"))
MIN_TRACKING_CONFIDENCE = float(os.getenv("MEDIAPIPE_TRACKING_CONFIDENCE", "0.5"))
SMOOTH_LANDMARKS = os.getenv("MEDIAPIPE_SMOOTH_LANDMARKS", "True").lower() == "true"

# Name mapping of key points to standard descriptors
LANDMARK_NAMES = {
    0: "Head",
    11: "Left Shoulder",
    12: "Right Shoulder",
    13: "Left Elbow",
    14: "Right Elbow",
    15: "Left Wrist",
    16: "Right Wrist",
    23: "Left Hip",
    24: "Right Hip",
    25: "Left Knee",
    26: "Right Knee",
    27: "Left Ankle",
    28: "Right Ankle",
    31: "Left Foot",
    32: "Right Foot"
}

# Add standard naming for all 33 keypoints to allow complete reconstruction
ALL_LANDMARK_MAP = {
    0: "NOSE", 1: "LEFT_EYE_INNER", 2: "LEFT_EYE", 3: "LEFT_EYE_OUTER",
    4: "RIGHT_EYE_INNER", 5: "RIGHT_EYE", 6: "RIGHT_EYE_OUTER",
    7: "LEFT_EAR", 8: "RIGHT_EAR", 9: "MOUTH_LEFT", 10: "MOUTH_RIGHT",
    11: "LEFT_SHOULDER", 12: "RIGHT_SHOULDER", 13: "LEFT_ELBOW", 14: "RIGHT_ELBOW",
    15: "LEFT_WRIST", 16: "RIGHT_WRIST", 17: "LEFT_PINKY", 18: "RIGHT_PINKY",
    19: "LEFT_INDEX", 20: "RIGHT_INDEX", 21: "LEFT_THUMB", 22: "RIGHT_THUMB",
    23: "LEFT_HIP", 24: "RIGHT_HIP", 25: "LEFT_KNEE", 26: "RIGHT_KNEE",
    27: "LEFT_ANKLE", 28: "RIGHT_ANKLE", 29: "LEFT_HEEL", 30: "RIGHT_HEEL",
    31: "LEFT_FOOT_INDEX", 32: "RIGHT_FOOT_INDEX"
}

class PoseEstimationService:
    @staticmethod
    def is_available() -> bool:
        """Check if MediaPipe dependencies are loaded on this server."""
        return MEDIAPIPE_AVAILABLE

    @staticmethod
    async def process_video_pose(
        analysis_id: str,
        video_path: str,
        db: AsyncIOMotorDatabase
    ):
        """
        Background task to read video frames, extract pose landmarks, and save results.
        """
        if not MEDIAPIPE_AVAILABLE:
            await db["PoseAnalysis"].update_one(
                {"_id": ObjectId(analysis_id)},
                {"$set": {
                    "processing_status": "failed",
                    "error_message": "MediaPipe dependencies not installed on the system."
                }}
            )
            return

        try:
            # 1. Load Video
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                raise RuntimeError("Failed to open video file stream.")

            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            
            # 2. Configure and Init MediaPipe
            mp_pose = mp.solutions.pose
            pose_instance = mp_pose.Pose(
                static_image_mode=False,
                model_complexity=MODEL_COMPLEXITY,
                smooth_landmarks=SMOOTH_LANDMARKS,
                min_detection_confidence=MIN_DETECTION_CONFIDENCE,
                min_tracking_confidence=MIN_TRACKING_CONFIDENCE
            )

            frames_data = []
            frame_num = 0
            
            # Update initial status
            await db["PoseAnalysis"].update_one(
                {"_id": ObjectId(analysis_id)},
                {"$set": {"processing_status": "processing"}}
            )

            # 3. Read Frame by Frame
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break

                timestamp = round(frame_num / fps, 3) if fps > 0 else 0.0
                
                # Convert BGR to RGB
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                
                # Perform Pose Detection
                results = pose_instance.process(rgb_frame)
                
                landmarks_list = []
                avg_confidence = 0.0
                
                if results.pose_landmarks:
                    total_visibility = 0.0
                    # Extract raw landmarks
                    for idx, lm in enumerate(results.pose_landmarks.landmark):
                        # Map index to landmark name
                        name = ALL_LANDMARK_MAP.get(idx, f"LANDMARK_{idx}")
                        
                        landmarks_list.append({
                            "name": name,
                            "x": float(lm.x),
                            "y": float(lm.y),
                            "z": float(lm.z),
                            "visibility": float(lm.visibility)
                        })
                        total_visibility += lm.visibility
                        
                    avg_confidence = total_visibility / len(results.pose_landmarks.landmark)

                frames_data.append({
                    "frame_number": frame_num,
                    "timestamp": timestamp,
                    "landmarks": landmarks_list,
                    "average_confidence": round(avg_confidence, 4)
                })

                frame_num += 1
                
                # Periodically update session status progress in DB (every 30 frames to avoid DB overload)
                if frame_num % 30 == 0:
                    await db["PoseAnalysis"].update_one(
                        {"_id": ObjectId(analysis_id)},
                        {"$set": {
                            "frames": frames_data
                        }}
                    )

            # 4. Clean up resources
            pose_instance.close()
            cap.release()

            # 5. Save final result document and update status
            await db["PoseAnalysis"].update_one(
                {"_id": ObjectId(analysis_id)},
                {"$set": {
                    "frames": frames_data,
                    "processing_status": "completed",
                    "error_message": None
                }}
            )

            # Sync session document
            pose_doc = await db["PoseAnalysis"].find_one({"_id": ObjectId(analysis_id)})
            if pose_doc:
                await db["AnalysisSessions"].update_one(
                    {"video_id": pose_doc["video_id"]},
                    {"$set": {"pose_analysis_id": analysis_id}}
                )
                
                print(f"[PIPELINE LOG] PoseAnalysis saved and completed for video: {pose_doc['video_id']}")
                
                # Automatically trigger Skeleton Tracking and Biomechanics!
                session_doc = await db["AnalysisSessions"].find_one({"video_id": pose_doc["video_id"]})
                if session_doc:
                    session_id = str(session_doc["_id"])
                    print(f"[PIPELINE LOG] Auto-triggering Biomechanical analysis for session: {session_id}")
                    from app.milestone2.services.analysis_service import BiomechanicalAnalysisService
                    await BiomechanicalAnalysisService.run_full_analysis(session_id, pose_doc["video_id"], db)

        except Exception as e:
            # Update failed status in database
            await db["PoseAnalysis"].update_one(
                {"_id": ObjectId(analysis_id)},
                {"$set": {
                    "processing_status": "failed",
                    "error_message": str(e)
                }}
            )
            # Find video_id and update status to failed
            pose_doc = await db["PoseAnalysis"].find_one({"_id": ObjectId(analysis_id)})
            if pose_doc:
                video_id = pose_doc["video_id"]
                await db["Videos"].update_one(
                    {"_id": ObjectId(video_id)},
                    {"$set": {"status": "failed"}}
                )
                await db["AnalysisSessions"].update_one(
                    {"video_id": video_id},
                    {"$set": {
                        "processing_status": "failed",
                        "error_message": str(e)
                    }}
                )
