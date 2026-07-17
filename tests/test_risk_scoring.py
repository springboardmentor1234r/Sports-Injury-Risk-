import os
import sys

# Add 'src' to the Python path
SRC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "src")
sys.path.append(SRC_DIR)

# Set up test directories
TEST_OUTPUTS_DIR = os.path.join(os.path.dirname(__file__), "test_outputs")

def setup_module(module):
    """Ensure test directories exist. We DO NOT rmtree here because it runs after biomechanics"""
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

from risk_scoring.engine import run_risk_scoring  # type: ignore

def test_03_risk_scoring():
    """Step 3: Score the risk using the biomechanics and summary CSVs."""
    VIDEO_NAME = "sports"
    ATHLETE_ID = "test_athlete_001"
    SESSION_ID = "test_session_123"
    
    # Ensure the CSVs from the previous test exist
    summary_csv = os.path.join(config.SUMMARY_OUTPUT_DIR, f"{VIDEO_NAME}_summary.csv")
    biomechanics_csv = os.path.join(config.CSV_OUTPUT_DIR, f"{VIDEO_NAME}_biomechanics.csv")
    assert os.path.exists(summary_csv), "Summary CSV not found. Run test_biomechanics.py first."
    assert os.path.exists(biomechanics_csv), "Biomechanics CSV not found. Run test_biomechanics.py first."
    
    risk_df = run_risk_scoring(VIDEO_NAME, ATHLETE_ID, SESSION_ID, quiet=True)
    assert not risk_df.empty, "Risk scoring dataframe was empty!"
    
    risk_score_csv = os.path.join(config.RISK_SCORE_OUTPUT_DIR, f"{VIDEO_NAME}_risk_score.csv")
    assert os.path.exists(risk_score_csv), "Risk score CSV not created!"
