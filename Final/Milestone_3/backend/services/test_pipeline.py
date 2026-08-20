import sys
import os
import asyncio
import unittest
from unittest.mock import AsyncMock, MagicMock, patch
from bson import ObjectId
from datetime import datetime, timezone

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend")))

from services.pipeline import run_pipeline_stages, get_or_compute_milestone3_results, verify_session_permission

def async_test(coro):
    def wrapper(*args, **kwargs):
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(coro(*args, **kwargs))
    return wrapper

class TestMilestone3PipelineService(unittest.TestCase):
    def setUp(self):
        self.mock_db = MagicMock()
        self.session_id = "60c72b2f9b1d8b2bad034341"
        self.current_user = {
            "_id": "60c72b2f9b1d8b2bad034339",
            "name": "Test Athlete",
            "role": "Athlete"
        }

        # Mock collections setup
        self.mock_sessions = MagicMock()
        self.mock_biomechanics = MagicMock()
        self.mock_skeleton = MagicMock()
        self.mock_athletes = MagicMock()
        
        self.mock_status = MagicMock()
        self.mock_status.update_one = AsyncMock()
        
        self.mock_anoms = MagicMock()
        self.mock_anoms.delete_many = AsyncMock()
        self.mock_anoms.insert_many = AsyncMock()
        
        self.mock_preds = MagicMock()
        self.mock_preds.delete_many = AsyncMock()
        self.mock_preds.insert_many = AsyncMock()
        
        self.mock_scores = MagicMock()
        self.mock_scores.delete_many = AsyncMock()
        self.mock_scores.insert_one = AsyncMock()
        
        self.mock_recs = MagicMock()
        self.mock_recs.delete_many = AsyncMock()
        self.mock_recs.insert_many = AsyncMock()

        def mock_getitem(name):
            if name == "AnalysisSessions": return self.mock_sessions
            elif name == "Biomechanics": return self.mock_biomechanics
            elif name == "SkeletonTracking": return self.mock_skeleton
            elif name == "athletes": return self.mock_athletes
            elif name == "Milestone3PipelineStatus": return self.mock_status
            elif name == "MovementAnomalies": return self.mock_anoms
            elif name == "InjuryRiskPredictions": return self.mock_preds
            elif name == "RiskScores": return self.mock_scores
            elif name == "Recommendations": return self.mock_recs
            return MagicMock()

        self.mock_db.__getitem__.side_effect = mock_getitem

    @async_test
    async def test_verify_permission_denial(self):
        # Athlete accessing another athlete's session
        self.mock_sessions.find_one = AsyncMock(return_value={
            "_id": ObjectId(self.session_id),
            "athlete_id": "different_athlete_123"
        })
        self.mock_athletes.find_one = AsyncMock(return_value={
            "athlete_id": "different_athlete_123",
            "full_name": "Unrelated Person"
        })

        from fastapi import HTTPException
        with self.assertRaises(HTTPException) as ctx:
            await verify_session_permission(self.session_id, self.current_user, self.mock_db)
        assert ctx.exception.status_code == 403

    @async_test
    @patch("services.anomaly_detection.AnomalyDetectionEngine.detect_anomalies")
    @patch("services.injury_risk_prediction.InjuryRiskPredictionEngine.predict_injury_risks")
    @patch("services.risk_scoring.RiskScoringEngine.calculate_risk_score")
    @patch("services.recommendation_engine.RecommendationEngine.generate_recommendations")
    async def test_normal_complete_pipeline(self, mock_rec, mock_score, mock_pred, mock_anom):
        # 1. Mock inputs
        self.mock_sessions.find_one = AsyncMock(return_value={
            "_id": ObjectId(self.session_id),
            "athlete_id": "ath_777",
            "video_id": "vid_777",
            "processing_status": "completed"
        })
        self.mock_biomechanics.find_one = AsyncMock(return_value={"session_id": self.session_id, "frames": [], "summary": {}})
        self.mock_skeleton.find_one = AsyncMock(return_value={"session_id": self.session_id, "frames": []})
        self.mock_athletes.find_one = AsyncMock(return_value={"athlete_id": "ath_777", "full_name": "Test Athlete"})

        # 2. Mock engine return mock objects
        mock_anom.return_value = []
        mock_pred.return_value = []
        
        mock_score_obj = MagicMock()
        mock_score_obj.model_dump.return_value = {"overall_injury_risk_score": 12.5}
        mock_score.return_value = mock_score_obj
        
        mock_rec.return_value = []

        # 3. run background pipeline Stages
        await run_pipeline_stages(self.session_id, self.mock_db)

        # 4. Assert updates were written
        assert self.mock_status.update_one.call_count >= 2
        # Verify completed status log call
        last_call_args = self.mock_status.update_one.call_args[0][1]["$set"]
        assert last_call_args["status"] == "COMPLETED"
        assert last_call_args["progress"] == 100
        print("Service Test 1 Passed: Pipeline completes and logs stages.")

    @async_test
    async def test_m2_still_processing(self):
        # Video is still processing
        self.mock_sessions.find_one = AsyncMock(return_value={
            "_id": ObjectId(self.session_id),
            "athlete_id": "ath_777",
            "processing_status": "processing"
        })

        await run_pipeline_stages(self.session_id, self.mock_db)
        
        # Verify status is logged as FAILED due to incomplete dependencies
        last_call_args = self.mock_status.update_one.call_args[0][1]["$set"]
        assert last_call_args["status"] == "FAILED"
        assert "Milestone 2 analysis is not complete" in last_call_args["message"]
        print("Service Test 2 Passed: Incomplete Milestone 2 transitions safely to failed status.")

if __name__ == "__main__":
    unittest.main()
