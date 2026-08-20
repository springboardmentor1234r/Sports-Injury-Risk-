import sys
import os
import asyncio
import unittest
from unittest.mock import AsyncMock, MagicMock, patch
from bson import ObjectId

# Path updates
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))

from routers.anomalies import get_session_anomalies
from routers.injury_risk import get_session_injury_risk
from routers.risk_scores import get_session_risk_score
from routers.recommendations import get_session_recommendations
from routers.intelligence import get_combined_analysis

# Helper to run async tests in unittest
def async_test(coro):
    def wrapper(*args, **kwargs):
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(coro(*args, **kwargs))
    return wrapper

class TestMilestone3APIRouters(unittest.TestCase):
    def setUp(self):
        self.mock_db = MagicMock()
        
        # Configure collections with AsyncMock to support await expressions
        self.mock_sessions = MagicMock()
        self.mock_sessions.find_one = AsyncMock(return_value={
            "_id": ObjectId("60c72b2f9b1d8b2bad034341"),
            "athlete_id": "60c72b2f9b1d8b2bad034345",
            "video_id": "vid_123",
            "processing_status": "completed"
        })
        
        self.mock_athletes = MagicMock()
        self.mock_athletes.find_one = AsyncMock(return_value={
            "_id": ObjectId("60c72b2f9b1d8b2bad034345"),
            "athlete_id": "60c72b2f9b1d8b2bad034345",
            "full_name": "Test Athlete"
        })
        
        def mock_getitem(name):
            if name == "AnalysisSessions":
                return self.mock_sessions
            elif name == "athletes":
                return self.mock_athletes
            return MagicMock()
            
        self.mock_db.__getitem__.side_effect = mock_getitem

        self.current_user = {
            "_id": "60c72b2f9b1d8b2bad034339",
            "name": "Test Athlete",
            "email": "test@athlete.com",
            "role": "Athlete"
        }
        
    @async_test
    @patch("routers.anomalies.get_or_compute_milestone3_results")
    async def test_anomalies_endpoint_ok(self, mock_pipeline):
        mock_pipeline.return_value = {
            "status": "completed",
            "anomalies": [
                {
                    "_id": "60c72b2f9b1d8b2bad034340",
                    "athlete_id": "60c72b2f9b1d8b2bad034345",
                    "session_id": "60c72b2f9b1d8b2bad034341",
                    "video_id": "vid_123",
                    "anomaly_type": "knee_valgus",
                    "frame_number": 15,
                    "severity": "High",
                    "affected_joint": "Left Knee",
                    "observed_value": 15.0,
                    "expected_value": 10.0,
                    "description": "Valgus deflection",
                    "created_at": "2026-08-15T10:00:00Z"
                }
            ]
        }
        
        res = await get_session_anomalies(
            session_id="60c72b2f9b1d8b2bad034341",
            severity=None,
            anomaly_type=None,
            affected_joint=None,
            current_user=self.current_user,
            db=self.mock_db
        )
        assert len(res) == 1
        assert res[0]["anomaly_type"] == "knee_valgus"
        assert res[0]["severity"] == "High"
        print("API Test 1 Passed: anomalies endpoint.")

    @async_test
    @patch("routers.injury_risk.get_or_compute_milestone3_results")
    async def test_injury_risk_endpoint_ok(self, mock_pipeline):
        mock_pipeline.return_value = {
            "injury_risks": [
                {
                    "_id": "60c72b2f9b1d8b2bad034342",
                    "athlete_id": "60c72b2f9b1d8b2bad034345",
                    "session_id": "60c72b2f9b1d8b2bad034341",
                    "video_id": "vid_123",
                    "injury_type": "ACL",
                    "probability": 75.0,
                    "risk_level": "High",
                    "evidence": {},
                    "explanation": "High ACL danger",
                    "contributing_metrics": [],
                    "created_at": "2026-08-15T10:00:00Z"
                }
            ]
        }
        
        res = await get_session_injury_risk(
            session_id="60c72b2f9b1d8b2bad034341",
            current_user=self.current_user,
            db=self.mock_db
        )
        assert len(res) == 1
        assert res[0]["injury_type"] == "ACL"
        assert res[0]["probability"] == 75.0
        print("API Test 2 Passed: injury-risk endpoint.")

    @async_test
    @patch("routers.risk_scores.get_or_compute_milestone3_results")
    async def test_risk_score_endpoint_ok(self, mock_pipeline):
        mock_pipeline.return_value = {
            "risk_score": {
                "_id": "60c72b2f9b1d8b2bad034343",
                "athlete_id": "60c72b2f9b1d8b2bad034345",
                "session_id": "60c72b2f9b1d8b2bad034341",
                "video_id": "vid_123",
                "biomechanical_score": 60.0,
                "history_score": 10.0,
                "asymmetry_score": 20.0,
                "load_score": 10.0,
                "fatigue_score": 0.0,
                "weighted_factors": {
                    "biomechanical_deviations": 0.35,
                    "historical_injury_factors": 0.20,
                    "movement_asymmetry": 0.20,
                    "training_load_indicators": 0.15,
                    "fatigue_indicators": 0.10
                },
                "overall_injury_risk_score": 30.0,
                "movement_quality_score": 60.0,
                "biomechanical_efficiency_score": 40.0,
                "fatigue_risk_score": 0.0,
                "overall_athlete_health_score": 70.0,
                "risk_category": "Moderate",
                "score_breakdown": {},
                "created_at": "2026-08-15T10:00:00Z"
            }
        }
        
        res = await get_session_risk_score(
            session_id="60c72b2f9b1d8b2bad034341",
            current_user=self.current_user,
            db=self.mock_db
        )
        assert res["overall_injury_risk_score"] == 30.0
        assert res["risk_category"] == "Moderate"
        print("API Test 3 Passed: risk-score endpoint.")

    @async_test
    @patch("routers.recommendations.get_or_compute_milestone3_results")
    async def test_recommendations_endpoint_ok(self, mock_pipeline):
        mock_pipeline.return_value = {
            "recommendations": [
                {
                    "_id": "60c72b2f9b1d8b2bad034344",
                    "athlete_id": "60c72b2f9b1d8b2bad034345",
                    "session_id": "60c72b2f9b1d8b2bad034341",
                    "recommendation_type": "Corrective Exercises",
                    "title": "Alignment drills",
                    "description": "Band walking squats",
                    "priority": "High",
                    "reason_evidence": "Valgus",
                    "created_at": "2026-08-15T10:00:00Z"
                }
            ]
        }
        
        res = await get_session_recommendations(
            session_id="60c72b2f9b1d8b2bad034341",
            priority=None,
            recommendation_type=None,
            current_user=self.current_user,
            db=self.mock_db
        )
        assert len(res) == 1
        assert res[0]["recommendation_type"] == "Corrective Exercises"
        assert res[0]["priority"] == "High"
        print("API Test 4 Passed: recommendations endpoint.")

    @async_test
    @patch("routers.intelligence.get_or_compute_milestone3_results")
    async def test_combined_endpoint_ok(self, mock_pipeline):
        mock_pipeline.return_value = {
            "status": "completed",
            "anomalies": [],
            "injury_risks": [],
            "risk_score": {
                "_id": "60c72b2f9b1d8b2bad034343",
                "athlete_id": "60c72b2f9b1d8b2bad034345",
                "session_id": "60c72b2f9b1d8b2bad034341",
                "video_id": "vid_123",
                "biomechanical_score": 60.0,
                "history_score": 10.0,
                "asymmetry_score": 20.0,
                "load_score": 10.0,
                "fatigue_score": 0.0,
                "weighted_factors": {
                    "biomechanical_deviations": 0.35,
                    "historical_injury_factors": 0.20,
                    "movement_asymmetry": 0.20,
                    "training_load_indicators": 0.15,
                    "fatigue_indicators": 0.10
                },
                "overall_injury_risk_score": 30.0,
                "movement_quality_score": 60.0,
                "biomechanical_efficiency_score": 40.0,
                "fatigue_risk_score": 0.0,
                "overall_athlete_health_score": 70.0,
                "risk_category": "Moderate",
                "score_breakdown": {},
                "created_at": "2026-08-15T10:00:00Z"
            },
            "recommendations": []
        }
        
        res = await get_combined_analysis(
            session_id="60c72b2f9b1d8b2bad034341",
            current_user=self.current_user,
            db=self.mock_db
        )
        assert res["status"] == "completed"
        assert isinstance(res["anomalies"], list)
        print("API Test 5 Passed: combined analysis endpoint.")

if __name__ == "__main__":
    unittest.main()
