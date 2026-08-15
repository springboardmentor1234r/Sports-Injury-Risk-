import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import Dict, Any
from api.dependencies import get_current_user
from database.sql_utils import get_user_by_id, update_user_profile_picture
import cloudinary
import cloudinary.uploader

router = APIRouter(prefix="/api/cloudinary", tags=["cloudinary"])

# Configure Cloudinary SDK using settings from environmental variables
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

@router.post("/upload-avatar")
async def upload_avatar(file: UploadFile = File(...), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Uploads profile avatar photo to Cloudinary CDN and updates profile link in MySQL database."""
    # Verify file is an image type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a valid image format.")
        
    try:
        # Perform direct upload to Cloudinary using file stream
        upload_result = cloudinary.uploader.upload(
            file.file,
            folder="moveiq_avatars",
            public_id=f"user_avatar_{current_user['user_id']}",
            overwrite=True,
            transformation=[
                {"width": 300, "height": 300, "crop": "fill", "gravity": "face"}
            ]
        )
        
        # Get secure CDN URL
        image_url = upload_result.get("secure_url")
        if not image_url:
            raise HTTPException(status_code=500, detail="Failed to retrieve URL from CDN.")
            
        # Update user profile in database
        success = update_user_profile_picture(current_user["user_id"], image_url)
        if not success:
            raise HTTPException(status_code=500, detail="Database update failed.")
            
        return {
            "message": "Avatar uploaded successfully",
            "profile_picture_url": image_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cloudinary upload error: {str(e)}")

@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Uploads an image photo to Cloudinary CDN and returns the secure URL."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a valid image format.")
        
    try:
        upload_result = cloudinary.uploader.upload(
            file.file,
            folder="moveiq_athletes",
            transformation=[
                {"width": 400, "height": 400, "crop": "fill", "gravity": "face"}
            ]
        )
        
        image_url = upload_result.get("secure_url")
        if not image_url:
            raise HTTPException(status_code=500, detail="Failed to retrieve URL from Cloudinary CDN.")
            
        return {
            "message": "Image uploaded successfully to Cloudinary",
            "secure_url": image_url,
            "profile_picture_url": image_url
        }
    except Exception as e:
        print(f"Error in upload_image: {e}")
        raise HTTPException(status_code=500, detail=f"Cloudinary upload error: {str(e)}")

