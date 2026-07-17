import os
import sys

# Add project root to path so we can import 'database'
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(PROJECT_ROOT)

from database.cloud_storage import upload_video

def test_cloudinary_upload():
    print("\n--- Starting Cloudinary Upload Test ---")
    
    # Let's use the raw video as our test file
    test_video = os.path.join(PROJECT_ROOT, "data", "raw_videos", "sports.mp4")
    
    if not os.path.exists(test_video):
        print(f"ERROR: Cannot find test video at {test_video}")
        return

    print(f"Test video found: {test_video}")
    print("Attempting to upload to Cloudinary...")
    
    # Upload the video (we give it a specific public_id so we can easily identify/delete it later in the Cloudinary dashboard)
    secure_url = upload_video(test_video, public_id="test_upload_sports_video")
    
    if secure_url:
        print("\nSUCCESS! Cloudinary is fully connected and working.")
        print(f"You can view your uploaded video here: {secure_url}")
    else:
        print("\nFAILURE! The upload failed.")
        print("Please check that your CLOUDINARY_URL in the .env file is correct.")

if __name__ == "__main__":
    test_cloudinary_upload()
