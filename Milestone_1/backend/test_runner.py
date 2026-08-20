import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime, timezone

from app.milestone2.models.pose import PoseAnalysisDB
from app.milestone2.services.pose_service import PoseEstimationService
from app.milestone2.services.video_service import extract_video_metadata

async def run_pipeline():
    print("[TEST RUNNER] Initializing MongoDB client...")
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["sports_injury"]
    
    # 1. Ensure clean mock state (delete any existing runs to avoid collisions)
    await db["Videos"].delete_many({})
    await db["AnalysisSessions"].delete_many({})
    await db["PoseAnalysis"].delete_many({})
    await db["SkeletonTracking"].delete_many({})
    await db["Biomechanics"].delete_many({})
    await db["athletes"].delete_many({})
    
    # 2. Insert dummy athlete
    print("[TEST RUNNER] Creating mock athlete...")
    athlete_res = await db["athletes"].insert_one({
        "full_name": "Test Athlete",
        "sport": "Sprinting",
        "risk_level": "Low"
    })
    athlete_id = str(athlete_res.inserted_id)
    
    # 3. Reference the existing local video file
    video_filename = "d0a4f6f0-3237-4dbd-94df-ac59c58c15c1.mp4"
    video_path = os.path.join("uploads", video_filename)
    if not os.path.exists(video_path):
        print(f"[TEST RUNNER] Error: Video path {video_path} does not exist!")
        return
        
    print(f"[TEST RUNNER] Extracting OpenCV metadata from: {video_path}")
    meta = extract_video_metadata(video_path)
    print(f"[TEST RUNNER] Metadata extracted: FPS={meta['fps']}, Resolution={meta['resolution']}, Duration={meta['duration']}, Frame Count={meta['frame_count']}")
    
    # 4. Insert Video document
    print("[TEST RUNNER] Inserting Video document...")
    video_dict = {
        "video_id": "VID-TEST",
        "athlete_id": athlete_id,
        "uploaded_by": "coach@test.com",
        "activity": "Sprinting",
        "original_filename": "athlete_sprinting.mp4",
        "stored_filename": video_filename,
        "file_size": os.path.getsize(video_path),
        "duration": meta["duration"],
        "resolution": meta["resolution"],
        "fps": meta["fps"],
        "status": "processing",
        "upload_date": datetime.now(timezone.utc)
    }
    video_res = await db["Videos"].insert_one(video_dict)
    video_id_str = str(video_res.inserted_id)
    
    # 5. Insert Analysis Session document
    print("[TEST RUNNER] Inserting Analysis Session document...")
    session_dict = {
        "athlete_id": athlete_id,
        "session_name": "Sprinting Analysis - Test",
        "activity_type": "Sprinting",
        "video_id": video_id_str,
        "pose_analysis_id": None,
        "skeleton_tracking_id": None,
        "biomechanics_id": None,
        "processing_status": "processing",
        "created_at": datetime.now(timezone.utc),
        "created_by": "coach@test.com"
    }
    session_res = await db["AnalysisSessions"].insert_one(session_dict)
    session_id_str = str(session_res.inserted_id)
    
    # 6. Insert PoseAnalysis document
    print("[TEST RUNNER] Inserting PoseAnalysis document...")
    pose_obj = PoseAnalysisDB(
        video_id=video_id_str,
        session_id=session_id_str,
        processing_status="processing"
    )
    pose_dict = pose_obj.model_dump(by_alias=True)
    if "_id" in pose_dict and pose_dict["_id"] is None:
        del pose_dict["_id"]
    pose_insert = await db["PoseAnalysis"].insert_one(pose_dict)
    analysis_id_str = str(pose_insert.inserted_id)
    
    # Update Session with pose analysis ID
    await db["AnalysisSessions"].update_one(
        {"_id": ObjectId(session_id_str)},
        {"$set": {"pose_analysis_id": analysis_id_str}}
    )
    
    print("[TEST RUNNER] Starting PoseEstimationService pipeline in background task simulation...")
    # Call the exact service method that runs in background
    await PoseEstimationService.process_video_pose(
        analysis_id_str,
        video_path,
        db
    )
    
    # 7. Check database outputs
    print("\n[TEST RUNNER] Verification Phase:")
    video_doc = await db["Videos"].find_one({"_id": ObjectId(video_id_str)})
    print(f"-> Video status: {video_doc['status']}")
    
    session_doc = await db["AnalysisSessions"].find_one({"_id": ObjectId(session_id_str)})
    print(f"-> Session status: {session_doc['processing_status']}")
    print(f"-> Session Pose Link: {session_doc['pose_analysis_id']}")
    print(f"-> Session Skeleton Link: {session_doc['skeleton_tracking_id']}")
    print(f"-> Session Biomechanics Link: {session_doc['biomechanics_id']}")
    
    pose_doc = await db["PoseAnalysis"].find_one({"_id": ObjectId(analysis_id_str)})
    print(f"-> Pose status: {pose_doc['processing_status']}")
    print(f"-> Pose frames count: {len(pose_doc['frames'])}")
    
    skeleton_doc = await db["SkeletonTracking"].find_one({"session_id": session_id_str})
    print(f"-> Skeleton doc exists: {skeleton_doc is not None}")
    if skeleton_doc:
        print(f"-> Skeleton tracking frames count: {len(skeleton_doc['frames'])}")
        
    biomechanics_doc = await db["Biomechanics"].find_one({"session_id": session_id_str})
    print(f"-> Biomechanics doc exists: {biomechanics_doc is not None}")
    if biomechanics_doc:
        print(f"-> Biomechanics summary max knee flexion left: {biomechanics_doc['summary']['max_knee_flexion_left']}")
        print(f"-> Biomechanics summary max knee flexion right: {biomechanics_doc['summary']['max_knee_flexion_right']}")
        print(f"-> Biomechanics summary landing flexion at impact: {biomechanics_doc['summary']['landing_flexion_at_impact']}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(run_pipeline())
