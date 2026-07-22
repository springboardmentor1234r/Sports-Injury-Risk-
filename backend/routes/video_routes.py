from fastapi import APIRouter, UploadFile, File
import shutil
import os
import cv2
from services.pose_service import process_video

router = APIRouter()

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@router.post("/upload-video")
async def upload_video(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)

    # Save uploaded video
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Process video with MediaPipe
    output_path = os.path.join(
        UPLOAD_FOLDER,
        "processed_" + file.filename
    )

    process_video(file_path, output_path)

    # Read video information
    cap = cv2.VideoCapture(file_path)

    if not cap.isOpened():
        return {"error": "Could not open uploaded video"}

    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    duration = frame_count / fps if fps > 0 else 0

    cap.release()

    return {
        "message": "Video uploaded successfully",
        "filename": file.filename,
        "processed_video": output_path,
        "video_info": {
            "width": width,
            "height": height,
            "fps": round(fps, 2),
            "total_frames": frame_count,
            "duration_seconds": round(duration, 2)
        }
    }