import os
import sys

# Add 'src' to the Python path
SRC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "src")
sys.path.append(SRC_DIR)

# Set up test directories
TEST_OUTPUTS_DIR = os.path.join(os.path.dirname(__file__), "test_outputs")

def setup_module(module):
    """Ensure test directories exist. We DO NOT rmtree here because it runs after risk_scoring"""
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
# Make get_risk_score raise an exception so it falls back to reading our test CSV
mock_mongo.get_risk_score.side_effect = NameError("Simulated DB failure")
sys.modules['database'] = MagicMock(mongo_utils=mock_mongo)
sys.modules['database.mongo_utils'] = mock_mongo

from recommendations.engine import build_graph, RecommendationState  # type: ignore

def test_04_recommendation_engine():
    """Step 4: Run the LLM recommendation engine."""
    VIDEO_NAME = "sports"
    SESSION_ID = "test_session_123"
    
    # Ensure the CSV from the previous test exists
    risk_score_csv = os.path.join(config.RISK_SCORE_OUTPUT_DIR, f"{VIDEO_NAME}_risk_score.csv")
    assert os.path.exists(risk_score_csv), "Risk score CSV not found. Run test_risk_scoring.py first."
    
    app = build_graph()
    
    initial_state: RecommendationState = {
        "session_id": SESSION_ID,
        "video_name": VIDEO_NAME,
        "risk_data": {},
        "flagged_issues": [],
        "categorized_issues": {},
        "recommended_exercises": {},
        "structured_summary": {},
        "output_path": "",
    }
    
    final_state = app.invoke(initial_state)
    
    # Verify the LLM successfully filled out the structured summary
    assert "structured_summary" in final_state
    assert "one_line_summary" in final_state["structured_summary"]
    
    recs_csv = os.path.join(config.RECOMMENDATION_OUTPUT_DIR, f"{VIDEO_NAME}_recommendations.csv")
    assert os.path.exists(recs_csv), "Recommendations CSV not created!"
