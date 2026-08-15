import cv2
import os
from src.logger import get_logger

logger = get_logger("key_frame_capture")

def capture_frames(video_path: str, frame_indices: list, output_dir: str, video_name: str) -> list:
    """
    Uses OpenCV random-access seeking to instantly jump to specific frames
    and save them as JPEGs.
    
    Returns a list of file paths to the saved images.
    """
    if not os.path.exists(video_path):
        logger.error(f"Video file not found: {video_path}")
        return []
        
    os.makedirs(output_dir, exist_ok=True)
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        logger.error(f"Failed to open video: {video_path}")
        return []
        
    saved_paths = []
    
    for frame_idx in frame_indices:
        # Jump directly to the requested frame
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        success, frame = cap.read()
        
        if success:
            img_path = os.path.join(output_dir, f"{video_name}_key_frame_{frame_idx}.jpg")
            cv2.imwrite(img_path, frame)
            saved_paths.append(img_path)
        else:
            logger.warning(f"Could not read frame {frame_idx} from {video_path}")
            
    cap.release()
    logger.info(f"Captured {len(saved_paths)} key frames.")
    return saved_paths
