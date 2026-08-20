import sys
import os
import asyncio
import unittest
from unittest.mock import AsyncMock, MagicMock, patch
from bson import ObjectId
from datetime import datetime, timezone

# Path updates
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))

from routers.pipeline import run_pipeline, get_status, get_results

# Helper to run async tests in unittest
def async_test(coro):
    def wrapper(*args, **kwargs):
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(coro(*args, **kwargs))
    return wrapper

class TestMilestone3PipelineRouter(unittest.TestCase):
    def setUp(self):
        self.mock_db = MagicMock()
        self.session_id = "60c72b2f9b1d8b2bad034341"
        self.current_user = {
            "_id": "60c72b2f9b1d8b2bad034339",
            "name": "Test Athlete",
            "email": "test@athlete.com",
            "role": "Athlete"
        }

        # Setup standard mock db collections
        self.mock_status = MagicMock()
        self.mock_sessions = MagicMock()
        self.mock_athletes = MagicMock()

        def mock_getitem(name):
            if name == "Milestone3PipelineStatus": return self.mock_status
            elif name == "AnalysisSessions": return self.mock_sessions
            elif name == "athletes": return self.mock_athletes
            return MagicMock()

        self.mock_db.__getitem__.side_effect = mock_getitem

    @async_test
    @patch("routers.pipeline.verify_session_permission")
    @patch("routers.pipeline.trigger_milestone3_pipeline")
    async def test_post_run_trigger_new(self, mock_trigger, mock_verify):
        mock_verify.return_value = {}
        
        # Scenario: Pipeline not run yet (status_doc is None)
        self.mock_status.find_one = AsyncMock(return_value=None)
        
        # trigger should be enqueued
        mock_trigger.return_value = {
            "session_id": self.session_id,
            "status": "PENDING",
            "stage": "queued",
            "progress": 0,
            "message": "Enqueuing Milestone 3 analysis stages.",
            "error": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }

        background_tasks = MagicMock()
        res = await run_pipeline(
            session_id=self.session_id,
            background_tasks=background_tasks,
            current_user=self.current_user,
            db=self.mock_db
        )
        assert res["status"] == "PENDING"
        assert res["stage"] == "queued"
        mock_trigger.assert_called_once()
        print("Router Test 1 Passed: Run triggers background execution successfully.")

    @async_test
    @patch("routers.pipeline.verify_session_permission")
    async def test_get_status_existing(self, mock_verify):
        mock_verify.return_value = {}
        
        # Scenario: Pipeline is currently processing
        self.mock_status.find_one = AsyncMock(return_value={
            "session_id": self.session_id,
            "status": "PROCESSING",
            "stage": "injury_risk_prediction",
            "progress": 50,
            "message": "Calculating predictions.",
            "error": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        })

        res = await get_status(
            session_id=self.session_id,
            current_user=self.current_user,
            db=self.mock_db
        )
        assert res["status"] == "PROCESSING"
        assert res["progress"] == 50
        print("Router Test 2 Passed: Status retrieves processing metrics successfully.")

    @async_test
    @patch("routers.pipeline.verify_session_permission")
    @patch("routers.pipeline.get_or_compute_milestone3_results")
    async def test_get_results_completed(self, mock_results, mock_verify):
        mock_verify.return_value = {}
        self.mock_status.find_one = AsyncMock(return_value={"status": "COMPLETED"})
        
        # Return mock computed structures
        mock_results.return_value = {
            "anomalies": [{"anomaly_type": "knee_valgus"}],
            "injury_risks": [],
            "risk_score": {"overall_injury_risk_score": 25.0},
            "recommendations": []
        }

        res = await get_results(
            session_id=self.session_id,
            current_user=self.current_user,
            db=self.mock_db
        )
        assert res["pipeline_status"] == "COMPLETED"
        assert len(res["anomalies"]) == 1
        assert res["risk_score"]["overall_injury_risk_score"] == 25.0
        print("Router Test 3 Passed: Results endpoint returns populated lists.")

if __name__ == "__main__":
    unittest.main()
