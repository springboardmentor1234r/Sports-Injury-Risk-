import os
import sys
import shutil

# Add 'src' to the Python path
SRC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "src")
sys.path.append(SRC_DIR)

# Set up test directories
TEST_OUTPUTS_DIR = os.path.join(os.path.dirname(__file__), "test_outputs")

def setup_module(module):
    """Ensure test directories exist. We DO NOT rmtree here because it runs after test_pose_extractor"""
    os.makedirs(TEST_OUTPUTS_DIR, exist_ok=True)

# Patch config values BEFORE importing the actual modules
import config  # type: ignore
config.CSV_OUTPUT_DIR = os.path.join(TEST_OUTPUTS_DIR, "csv's")
config.SUMMARY_OUTPUT_DIR = os.path.join(TEST_OUTPUTS_DIR, "csv's/summary")
config.RISK_SCORE_OUTPUT_DIR = os.path.join(TEST_OUTPUTS_DIR, "risk_scores")
config.RECOMMENDATION_OUTPUT_DIR = os.path.join(TEST_OUTPUTS_DIR, "recommendations")
config.ANNOTATED_VIDEO_DIR = os.path.join(TEST_OUTPUTS_DIR, "annotated_videos")

from unittest.mock import MagicMock
mock_mongo = MagicMock()
sys.modules['database'] = MagicMock(mongo_utils=mock_mongo)
sys.modules['database.mongo_utils'] = mock_mongo

from biomechanics.analyzer import run_biomechanics_only  # type: ignore

def test_02_biomechanics_analysis():
    """Step 2: Read landmarks CSV and calculate biomechanics."""
    VIDEO_NAME = "sports"
    ATHLETE_ID = "test_athlete_001"
    SESSION_ID = "test_session_123"
    
    # Ensure the landmark CSV from the previous test exists
    landmarks_csv = os.path.join(config.CSV_OUTPUT_DIR, f"{VIDEO_NAME}_landmarks.csv")
    assert os.path.exists(landmarks_csv), f"Landmarks CSV not found at {landmarks_csv}. Run test_pose_extractor.py first."
    
    result_video_name = run_biomechanics_only(VIDEO_NAME, ATHLETE_ID, SESSION_ID)
    assert result_video_name == VIDEO_NAME
    
    # Verify new CSVs were created
    biomechanics_csv = os.path.join(config.CSV_OUTPUT_DIR, f"{VIDEO_NAME}_biomechanics.csv")
    summary_csv = os.path.join(config.SUMMARY_OUTPUT_DIR, f"{VIDEO_NAME}_summary.csv")
    assert os.path.exists(biomechanics_csv), "Biomechanics CSV not created!"
    assert os.path.exists(summary_csv), "Summary CSV not created!"
