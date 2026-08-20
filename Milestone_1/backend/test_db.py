import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def inspect():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["sports_injury"]
    
    print("--- Videos ---")
    async for v in db["Videos"].find():
        print(f"ID: {v['_id']}, File: {v['original_filename']}, Status: {v.get('status')}, Resolution: {v.get('resolution')}")
        
    print("\n--- PoseAnalysis ---")
    async for p in db["PoseAnalysis"].find():
        print(f"ID: {p['_id']}, Video ID: {p['video_id']}, Status: {p.get('processing_status')}, Frames: {len(p.get('frames', []))}")
        
    print("\n--- SkeletonTracking ---")
    async for s in db["SkeletonTracking"].find():
        print(f"ID: {s['_id']}, Session ID: {s.get('session_id')}, Frames: {len(s.get('frames', []))}")

    print("\n--- Biomechanics ---")
    async for b in db["Biomechanics"].find():
        print(f"ID: {b['_id']}, Session ID: {b.get('session_id')}, Frames: {len(b.get('frames', []))}")
        
    print("\n--- AnalysisSessions ---")
    async for s in db["AnalysisSessions"].find():
        print(f"ID: {s['_id']}, Video ID: {s['video_id']}, Status: {s.get('processing_status')}")

    client.close()

if __name__ == "__main__":
    asyncio.run(inspect())
