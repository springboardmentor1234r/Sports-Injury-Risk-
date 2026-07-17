import os
from dotenv import load_dotenv

# Load environment variables BEFORE importing cloudinary
load_dotenv()

import cloudinary
import cloudinary.uploader
import cloudinary.api

# Explicitly configure using the URL if needed
cloudinary_url = os.getenv("CLOUDINARY_URL")
if cloudinary_url:
    cloudinary.config(
        cloud_url=cloudinary_url,
        secure=True
    )

def upload_video(file_path: str, public_id: str = None) -> str:
    """
    Uploads a video to Cloudinary.
    
    Args:
        file_path (str): The local path to the video file (e.g., outputs/annotated_videos/video_annotated.mp4).
        public_id (str): Optional string to explicitly name the file on Cloudinary.
        
    Returns:
        str: The secure public URL of the uploaded video, or None if upload failed.
    """
    
    if not os.getenv("CLOUDINARY_URL"):
        print("Warning: CLOUDINARY_URL not found in environment variables. Upload skipped.")
        return None
        
    if not os.path.exists(file_path):
        print(f"Error: Video file {file_path} not found.")
        return None

    print(f"Uploading {file_path} to Cloudinary...")
    try:
        # Use resource_type 'video' specifically for mp4s
        upload_result = cloudinary.uploader.upload(
            file_path, 
            resource_type="video",
            public_id=public_id,
            folder="sports_injury_videos"
        )
        
        secure_url = upload_result.get("secure_url")
        print(f"Upload successful! URL: {secure_url}")
        return secure_url
        
    except Exception as e:
        print(f"Failed to upload video to Cloudinary: {e}")
        return None
