import os
import uuid
import datetime
import cv2
from fastapi import UploadFile, HTTPException, status
from app.db.mongo import get_mongo_db

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "videos")
os.makedirs(UPLOAD_DIR, exist_ok=True)

VALID_MOVEMENTS = [
    "Running",
    "Sprinting",
    "Jumping",
    "Squatting",
    "Landing",
    "Throwing",
    "Cutting Movements"
]

ALLOWED_EXTENSIONS = {".mp4", ".avi", ".mov"}

def save_uploaded_video(file: UploadFile, movement_type: str, user_email: str = "demo@sportsmed.io") -> dict:
    """
    Validates and saves uploaded video file, extracts OpenCV metadata,
    and stores payload in MongoDB 'video_metadata' collection.
    """
    # 1. Validate movement tag
    if movement_type not in VALID_MOVEMENTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid movement tag '{movement_type}'. Allowed: {', '.join(VALID_MOVEMENTS)}"
        )
        
    # 2. Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{file_ext}'. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # 3. Generate unique video ID and save to local disk buffer
    video_id = f"VID-{uuid.uuid4().hex[:8].upper()}"
    filename = f"{video_id}{file_ext}"
    dest_path = os.path.join(UPLOAD_DIR, filename)

    try:
        with open(dest_path, "wb") as buffer:
            content = file.file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save video buffer: {str(e)}"
        )

    # 4. Extract OpenCV metadata
    fps = 30.0
    total_frames = 90
    width = 1280
    height = 720
    duration = 3.0

    try:
        cap = cv2.VideoCapture(dest_path)
        if cap.isOpened():
            extracted_fps = cap.get(cv2.CAP_PROP_FPS)
            extracted_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            extracted_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            extracted_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

            if extracted_fps and extracted_fps > 0:
                fps = float(extracted_fps)
            if extracted_frames and extracted_frames > 0:
                total_frames = extracted_frames
            if extracted_w > 0 and extracted_h > 0:
                width, height = extracted_w, extracted_h

            duration = round(total_frames / fps, 2)
            cap.release()
    except Exception as cv_err:
        print(f"OpenCV metadata warning: {cv_err}")

    # Relative path for web serving
    web_url = f"/uploads/videos/{filename}"

    metadata = {
        "video_id": video_id,
        "filename": file.filename,
        "file_name": filename,
        "file_path": dest_path,
        "web_url": web_url,
        "movement_type": movement_type,
        "fps": round(fps, 2),
        "total_frames": total_frames,
        "resolution": {"width": width, "height": height},
        "duration_seconds": duration,
        "uploaded_by": user_email,
        "status": "UPLOADED",
        "created_at": datetime.datetime.utcnow().isoformat()
    }

    # 5. Persist to MongoDB video_metadata collection
    mongo = get_mongo_db()
    mongo["video_metadata"].insert_one(metadata)

    if "_id" in metadata:
        metadata["_id"] = str(metadata["_id"])

    return metadata

def get_video_metadata(video_id: str) -> dict:
    """Retrieve video metadata document from MongoDB."""
    mongo = get_mongo_db()
    video_doc = mongo["video_metadata"].find_one({"video_id": video_id})
    if not video_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video with ID '{video_id}' not found."
        )
    doc_copy = dict(video_doc)
    if "_id" in doc_copy:
        doc_copy["_id"] = str(doc_copy["_id"])
    return doc_copy

def list_all_videos() -> list:
    """Retrieve all uploaded video metadata entries."""
    mongo = get_mongo_db()
    docs = mongo["video_metadata"].find()
    res = []
    for d in docs:
        d_copy = dict(d)
        if "_id" in d_copy:
            d_copy["_id"] = str(d_copy["_id"])
        res.append(d_copy)
    return res
