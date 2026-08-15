import pytest
from unittest.mock import patch, MagicMock
from database.cloud_storage import upload_video

@patch("database.cloud_storage.cloudinary.uploader.upload_large")
def test_upload_video_success(mock_upload_large):
    # Mock successful Cloudinary response
    mock_upload_large.return_value = {
        "secure_url": "https://res.cloudinary.com/demo/video/upload/v1234/raw_session_123.mp4",
        "public_id": "raw_session_123"
    }
    
    # Call our wrapper function
    result_url = upload_video("local_file.mp4", public_id="raw_session_123")
    
    # Verify the Cloudinary SDK was called with the correct parameters
    mock_upload_large.assert_called_once_with(
        "local_file.mp4", 
        resource_type="video", 
        public_id="raw_session_123"
    )
    
    # Verify our function correctly returned the secure URL
    assert result_url == "https://res.cloudinary.com/demo/video/upload/v1234/raw_session_123.mp4"

@patch("database.cloud_storage.cloudinary.uploader.upload_large")
def test_upload_video_failure(mock_upload_large):
    # Simulate a Cloudinary API Error
    mock_upload_large.side_effect = Exception("Invalid API Key")
    
    # Call our wrapper function and verify it returns None instead of crashing
    result_url = upload_video("local_file.mp4")
    
    assert result_url is None
