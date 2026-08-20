import os
import uuid
import shutil
from datetime import datetime, timezone
from typing import Tuple, Dict, Any, List, Optional
from fastapi import UploadFile, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

# Import OpenCV and Numpy dynamically or handle missing dependency gracefully
try:
    import cv2
    import numpy as np
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {".mp4", ".avi", ".mov", ".webm"}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB limit

# Reusable core functions

def ensure_upload_dir():
    """Ensure local upload directory exists."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)

def validate_and_save_video(file: UploadFile) -> Tuple[str, str, int]:
    """
    Validate file extension and size, then save to /uploads folder with a unique name.
    """
    ensure_upload_dir()
    
    # 1. Validate extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Video format rejected. Supported extensions: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Generate unique filename to avoid duplicates
    stored_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, stored_filename)
    
    # 2. Save file locally and track size
    file_size = 0
    try:
        with open(file_path, "wb") as buffer:
            # Copy in chunks to track size and prevent memory spikes
            while chunk := file.file.read(8192):
                file_size += len(chunk)
                if file_size > MAX_FILE_SIZE:
                    # Clean up file and throw size limit error
                    buffer.close()
                    if os.path.exists(file_path):
                        os.remove(file_path)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="Video file exceeds maximum size limit of 100MB."
                    )
                buffer.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write video file to local disk: {str(e)}"
        )
        
    return stored_filename, file_path, file_size

def extract_video_metadata(file_path: str) -> Dict[str, Any]:
    """
    Extract video metadata (resolution, duration, FPS, frames count) using OpenCV.
    Performs corruption checks by attempting to read the first frame.
    """
    if not CV2_AVAILABLE:
        # Fallback metadata if OpenCV is not loaded
        return {
            "duration": 0.0,
            "resolution": "Unknown",
            "fps": 0.0,
            "frame_count": 0,
            "warnings": ["OpenCV/Numpy libraries not loaded on server environment."]
        }
        
    cap = cv2.VideoCapture(file_path)
    if not cap.isOpened():
        # Clean up file and raise corruption error
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Corrupted video file. Failed to open video stream."
        )
        
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    # Check if video is corrupted/unreadable
    ret, frame = cap.read()
    cap.release()
    
    if not ret or frame is None:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Corrupted video file. Unable to decode video frames."
        )
        
    duration = 0.0
    if fps > 0:
        duration = round(frame_count / fps, 2)
        
    return {
        "duration": duration,
        "resolution": f"{width}x{height}",
        "fps": round(fps, 2),
        "frame_count": frame_count
    }

# Reusable Frame Processing Pipelines

def extract_frame(video_path: str, frame_index: int) -> Optional[Any]:
    """Extract a single frame at the given index."""
    if not CV2_AVAILABLE:
        return None
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return None
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
    ret, frame = cap.read()
    cap.release()
    return frame if ret else None

def sample_frames(video_path: str, target_fps: int = 5) -> List[Any]:
    """Sample frames from the video at a target frame rate."""
    sampled = []
    if not CV2_AVAILABLE:
        return sampled
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return sampled
        
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    if fps <= 0:
        cap.release()
        return sampled
        
    # Calculate interval multiplier
    step = max(1, int(fps / target_fps))
    
    for idx in range(0, total_frames, step):
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if not ret:
            break
        sampled.append(frame)
        
    cap.release()
    return sampled

def resize_frame(frame: Any, target_size: Tuple[int, int] = (640, 480)) -> Any:
    """Resize a video frame using OpenCV."""
    if not CV2_AVAILABLE:
        return frame
    return cv2.resize(frame, target_size, interpolation=cv2.INTER_AREA)

def normalize_brightness(frame: Any) -> Any:
    """Apply histogram equalization to normalize brightness contrast."""
    if not CV2_AVAILABLE:
        return frame
    # Convert to YCrCb color space
    ycrcb = cv2.cvtColor(frame, cv2.COLOR_BGR2YCrCb)
    # Equalize the histogram of the Y (luminance) channel
    ycrcb[:, :, 0] = cv2.equalizeHist(ycrcb[:, :, 0])
    # Convert back to BGR
    return cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)

def reduce_noise(frame: Any) -> Any:
    """Apply standard bilateral filtering to denoise while preserving edges."""
    if not CV2_AVAILABLE:
        return frame
    return cv2.bilateralFilter(frame, d=9, sigmaColor=75, sigmaSpace=75)

def validate_frame_quality(frame: Any) -> Dict[str, Any]:
    """Analyze quality statistics of a frame (contrast, brightness)."""
    if not CV2_AVAILABLE:
        return {"status": "skipped", "warnings": ["OpenCV not available"]}
        
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    mean_brightness = float(np.mean(gray))
    std_contrast = float(np.std(gray))
    
    warnings = []
    if mean_brightness < 40:
        warnings.append("Video frame lighting is too dark.")
    elif mean_brightness > 220:
        warnings.append("Video frame lighting is overexposed.")
        
    if std_contrast < 15:
        warnings.append("Video frame has low contrast.")
        
    return {
        "status": "passed" if len(warnings) == 0 else "warning",
        "mean_brightness": mean_brightness,
        "contrast_std": std_contrast,
        "warnings": warnings
    }
