import math
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.milestone2.models.skeleton import SkeletonTrackingDB, FrameSkeletonData, ConnectionLine

# Joint connection mapping to draw skeletal bones
SKELETON_CONNECTIONS = [
    ("LEFT_SHOULDER", "RIGHT_SHOULDER"),
    ("LEFT_HIP", "RIGHT_HIP"),
    ("LEFT_SHOULDER", "LEFT_ELBOW"),
    ("LEFT_ELBOW", "LEFT_WRIST"),
    ("RIGHT_SHOULDER", "RIGHT_ELBOW"),
    ("RIGHT_ELBOW", "RIGHT_WRIST"),
    ("LEFT_HIP", "LEFT_KNEE"),
    ("LEFT_KNEE", "LEFT_ANKLE"),
    ("LEFT_ANKLE", "LEFT_FOOT_INDEX"),
    ("RIGHT_HIP", "RIGHT_KNEE"),
    ("RIGHT_KNEE", "RIGHT_ANKLE"),
    ("RIGHT_ANKLE", "RIGHT_FOOT_INDEX"),
    ("LEFT_SHOULDER", "LEFT_HIP"),
    ("RIGHT_SHOULDER", "RIGHT_HIP")
]

class SkeletonTrackingService:
    @staticmethod
    def calculate_distance(p1: Dict[str, float], p2: Dict[str, float]) -> float:
        """Measure Euclidean distance between two 3D coordinates."""
        return math.sqrt(
            (p1.get('x', 0) - p2.get('x', 0))**2 + 
            (p1.get('y', 0) - p2.get('y', 0))**2 + 
            (p1.get('z', 0) - p2.get('z', 0))**2
        )

    @staticmethod
    def process_tracking(
        pose_doc: Dict[str, Any],
        session_id: str,
        video_id: str
    ) -> Dict[str, Any]:
        """
        Processes frame coordinates to track skeleton velocities, accelerations, and motion trails.
        """
        pose_frames = pose_doc.get("frames", [])
        tracking_frames = []
        
        # History for velocity/acceleration calculations
        prev_frame_data = None
        prev_velocities = {}
        
        # Keep track of coordinate trails for primary points (Head, Wrists, Ankles)
        trail_joints = ["Head", "LEFT_WRIST", "RIGHT_WRIST", "LEFT_ANKLE", "RIGHT_ANKLE"]
        motion_trails = {j: [] for j in trail_joints}

        for idx, pf in enumerate(pose_frames):
            frame_num = pf["frame_number"]
            timestamp = pf["timestamp"]
            landmarks = pf["landmarks"]
            avg_conf = pf["average_confidence"]
            
            lms_map = {lm["name"]: lm for lm in landmarks}
            
            # 1. Map connection coordinate lines
            connections = []
            for c in SKELETON_CONNECTIONS:
                p1 = lms_map.get(c[0])
                p2 = lms_map.get(c[1])
                if p1 and p2:
                    connections.append(ConnectionLine(
                        name_from=c[0],
                        name_to=c[1],
                        x1=p1["x"],
                        y1=p1["y"],
                        x2=p2["x"],
                        y2=p2["y"]
                    ))

            # 2. Append points to motion trails (keep last 30 frames for a sliding motion window)
            for j in trail_joints:
                lm = lms_map.get(j)
                if lm:
                    motion_trails[j].append([lm["x"], lm["y"]])
                    if len(motion_trails[j]) > 30:
                        motion_trails[j].pop(0)

            # 3. Calculate Velocities and Accelerations
            velocities = {}
            accelerations = {}
            
            dt = (timestamp - prev_frame_data["timestamp"]) if prev_frame_data else 0.0
            dt = max(0.001, dt)  # Prevent divide by zero

            for name, lm in lms_map.items():
                if prev_frame_data and name in prev_frame_data["lms"]:
                    prev_lm = prev_frame_data["lms"][name]
                    # Calculate velocity (distance units per second)
                    dist = SkeletonTrackingService.calculate_distance(lm, prev_lm)
                    v = dist / dt
                    velocities[name] = round(v, 4)
                    
                    # Calculate acceleration (velocity change per second)
                    prev_v = prev_velocities.get(name, 0.0)
                    a = (v - prev_v) / dt
                    accelerations[name] = round(a, 4)
                else:
                    velocities[name] = 0.0
                    accelerations[name] = 0.0

            # Compile frame details
            frame_tracking = FrameSkeletonData(
                frame_number=frame_num,
                timestamp=timestamp,
                connections=connections,
                joint_velocities=velocities,
                joint_accelerations=accelerations,
                motion_trail={k: list(v) for k, v in motion_trails.items()},
                tracking_confidence=avg_conf
            )
            
            tracking_frames.append(frame_tracking)
            
            # Cache previous step context
            prev_frame_data = {
                "timestamp": timestamp,
                "lms": lms_map
            }
            prev_velocities = velocities

        # Build final tracking DB document
        tracking_doc = SkeletonTrackingDB(
            session_id=session_id,
            video_id=video_id,
            frames=tracking_frames
        )
        
        return tracking_doc.model_dump(by_alias=True)
