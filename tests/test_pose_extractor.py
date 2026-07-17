import os
import sys
import shutil

# Add 'src' to the Python path
SRC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "src")
sys.path.append(SRC_DIR)

# Set up test directories
TEST_OUTPUTS_DIR = os.path.join(os.path.dirname(__file__), "test_outputs")

def setup_module(module):
    """Create fresh test directories before any tests run."""
    if os.path.exists(TEST_OUTPUTS_DIR):
        shutil.rmtree(TEST_OUTPUTS_DIR)
    os.makedirs(TEST_OUTPUTS_DIR)

# Patch config values BEFORE importing the actual modules
import config  # type: ignore
config.CSV_OUTPUT_DIR = os.path.join(TEST_OUTPUTS_DIR, "csv's")
config.SUMMARY_OUTPUT_DIR = os.path.join(TEST_OUTPUTS_DIR, "csv's/summary")
config.RISK_SCORE_OUTPUT_DIR = os.path.join(TEST_OUTPUTS_DIR, "risk_scores")
config.RECOMMENDATION_OUTPUT_DIR = os.path.join(TEST_OUTPUTS_DIR, "recommendations")
config.ANNOTATED_VIDEO_DIR = os.path.join(TEST_OUTPUTS_DIR, "annotated_videos")

from pose_extractor import extract_landmarks_from_video, save_to_csv  # type: ignore

def test_01_pose_extraction():
    """Step 1: Extract pose landmarks and save to CSV."""
    VIDEO_NAME = "sports"
    VIDEO_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "raw_videos", f"{VIDEO_NAME}.mp4")
    
    assert os.path.exists(VIDEO_PATH), f"Test video not found: {VIDEO_PATH}"
    
    frames_data = extract_landmarks_from_video(VIDEO_PATH, is_webcam=False, save_annotated_video=False)
    save_to_csv(frames_data, VIDEO_PATH, is_webcam=False)
    
    # Verify CSV was created in our isolated test folder
    csv_path = os.path.join(config.CSV_OUTPUT_DIR, f"{VIDEO_NAME}_landmarks.csv")
    assert os.path.exists(csv_path), "Pose extraction failed to create landmarks CSV!"
