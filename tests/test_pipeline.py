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

# Mock the MongoDB module entirely so no tests touch the real DB
from unittest.mock import MagicMock
mock_mongo = MagicMock()
mock_mongo.get_risk_score.side_effect = NameError("Simulated DB failure")
sys.modules['database'] = MagicMock(mongo_utils=mock_mongo)
sys.modules['database.mongo_utils'] = mock_mongo

# Import pipeline modules
from pose_extractor import extract_landmarks_from_video, save_to_csv  # type: ignore
from biomechanics.analyzer import run_biomechanics_only  # type: ignore
from risk_scoring.engine import run_risk_scoring  # type: ignore
from recommendations.engine import build_graph, RecommendationState  # type: ignore


class TestEndToEndPipeline:
    """
    Runs the entire pipeline sequentially on 'sports.mp4' from data/raw_videos/.
    Validates that the file outputs cascade correctly as they did before MongoDB.
    """
    
    VIDEO_NAME = "sports"
    VIDEO_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "raw_videos", f"{VIDEO_NAME}.mp4")
    ATHLETE_ID = "test_athlete_001"
    SESSION_ID = "test_session_123"

    def test_01_pose_extraction(self):
        """Step 1: Extract pose landmarks and save to CSV."""
        assert os.path.exists(self.VIDEO_PATH), f"Test video not found: {self.VIDEO_PATH}"
        
        frames_data = extract_landmarks_from_video(self.VIDEO_PATH, is_webcam=False, save_annotated_video=False)
        save_to_csv(frames_data, self.VIDEO_PATH, is_webcam=False)
        
        csv_path = os.path.join(config.CSV_OUTPUT_DIR, f"{self.VIDEO_NAME}_landmarks.csv")
        assert os.path.exists(csv_path), "Pose extraction failed to create landmarks CSV!"

    def test_02_biomechanics_analysis(self):
        """Step 2: Read landmarks CSV and calculate biomechanics."""
        result_video_name = run_biomechanics_only(self.VIDEO_NAME, self.ATHLETE_ID, self.SESSION_ID)
        assert result_video_name == self.VIDEO_NAME
        
        biomechanics_csv = os.path.join(config.CSV_OUTPUT_DIR, f"{self.VIDEO_NAME}_biomechanics.csv")
        summary_csv = os.path.join(config.SUMMARY_OUTPUT_DIR, f"{self.VIDEO_NAME}_summary.csv")
        assert os.path.exists(biomechanics_csv), "Biomechanics CSV not created!"
        assert os.path.exists(summary_csv), "Summary CSV not created!"

    def test_03_risk_scoring(self):
        """Step 3: Score the risk using the biomechanics and summary CSVs."""
        risk_df = run_risk_scoring(self.VIDEO_NAME, self.ATHLETE_ID, self.SESSION_ID, quiet=True)
        assert not risk_df.empty, "Risk scoring dataframe was empty!"
        
        risk_score_csv = os.path.join(config.RISK_SCORE_OUTPUT_DIR, f"{self.VIDEO_NAME}_risk_score.csv")
        assert os.path.exists(risk_score_csv), "Risk score CSV not created!"

    def test_04_recommendation_engine(self):
        """Step 4: Run the LLM recommendation engine."""
        app = build_graph()
        
        initial_state: RecommendationState = {
            "session_id": self.SESSION_ID,
            "video_name": self.VIDEO_NAME,
            "risk_data": {},
            "flagged_issues": [],
            "categorized_issues": {},
            "recommended_exercises": {},
            "structured_summary": {},
            "output_path": "",
        }
        
        final_state = app.invoke(initial_state)
        
        assert "structured_summary" in final_state
        assert "one_line_summary" in final_state["structured_summary"]
        
        recs_csv = os.path.join(config.RECOMMENDATION_OUTPUT_DIR, f"{self.VIDEO_NAME}_recommendations.csv")
        assert os.path.exists(recs_csv), "Recommendations CSV not created!"
