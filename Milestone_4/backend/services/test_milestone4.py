import sys
import os
import asyncio
import unittest
from unittest.mock import AsyncMock, MagicMock, patch
from bson import ObjectId
from datetime import datetime, timezone

# Add parent path to resolve module imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend")))

from report_service import ReportService
from history_service import HistoryService
from notification_service import NotificationService
from schemas.report import ReportResponse
from schemas.history import HistoryResponse
from schemas.notification import NotificationResponse

def async_test(coro):
    def wrapper(*args, **kwargs):
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(coro(*args, **kwargs))
    return wrapper

class TestMilestone4IntelligenceLayer(unittest.TestCase):
    def setUp(self):
        self.mock_db = MagicMock()
        self.athlete_id = "60c72b2f9b1d8b2bad034339"
        self.session_id = "60c72b2f9b1d8b2bad034341"
        self.video_id = "60c72b2f9b1d8b2bad034345"

        # Mock collection properties
        self.mock_reports = MagicMock()
        self.mock_sessions = MagicMock()
        self.mock_athletes = MagicMock()
        self.mock_scores = MagicMock()
        self.mock_anoms = MagicMock()
        self.mock_preds = MagicMock()
        self.mock_recs = MagicMock()
        self.mock_biomechanics = MagicMock()
        self.mock_history = MagicMock()
        self.mock_notifications = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.to_list = AsyncMock(return_value=[])
        self.mock_notifications.find = MagicMock(return_value=mock_cursor)

        # Database index mapping
        def mock_getitem(name):
            if name == "AthleteReports": return self.mock_reports
            elif name == "AnalysisSessions": return self.mock_sessions
            elif name == "athletes": return self.mock_athletes
            elif name == "RiskScores": return self.mock_scores
            elif name == "MovementAnomalies": return self.mock_anoms
            elif name == "InjuryRiskPredictions": return self.mock_preds
            elif name == "Recommendations": return self.mock_recs
            elif name == "Biomechanics": return self.mock_biomechanics
            elif name == "AnalysisHistory": return self.mock_history
            elif name == "Notifications": return self.mock_notifications
            return MagicMock()

        self.mock_db.__getitem__.side_effect = mock_getitem

    @async_test
    async def test_report_compilation_success(self):
        """
        1. Test report compilation from valid Milestone 3 data.
        """
        # Mock empty existing report
        self.mock_reports.find_one = AsyncMock(return_value=None)
        self.mock_reports.insert_one = AsyncMock()

        # Mock session metadata
        self.mock_sessions.find_one = AsyncMock(return_value={
            "_id": ObjectId(self.session_id),
            "athlete_id": self.athlete_id,
            "processing_status": "completed",
            "completed_at": datetime.now(timezone.utc)
        })

        # Mock athlete details
        self.mock_athletes.find_one = AsyncMock(return_value={
            "athlete_id": self.athlete_id,
            "full_name": "Athlete Name"
        })

        # Mock Milestone 3 documents
        self.mock_scores.find_one = AsyncMock(return_value={
            "overall_injury_risk_score": 35.0,
            "risk_category": "Medium",
            "athlete_health_score": 65.0,
            "movement_quality_score": 70.0,
            "score_breakdown": {
                "data_limitations": ["ACWR history missing"]
            }
        })

        self.mock_anoms.find = MagicMock()
        self.mock_anoms.find().to_list = AsyncMock(return_value=[
            {"anomaly_type": "knee_valgus", "severity": "High", "joint": "Knee", "message": "Valgus lean"}
        ])

        self.mock_preds.find = MagicMock()
        self.mock_preds.find().to_list = AsyncMock(return_value=[
            {"injury_type": "ACL", "probability": 45.0}
        ])

        self.mock_recs.find = MagicMock()
        self.mock_recs.find().to_list = AsyncMock(return_value=[
            {"recommendation_type": "Strengthening", "title": "Squats", "description": "Strengthen quad muscle.", "priority": "High"}
        ])

        self.mock_biomechanics.find_one = AsyncMock(return_value={
            "summary": {"max_knee_valgus": 12.0}
        })

        # Run compilation service
        report = await ReportService.generate_report(self.athlete_id, self.session_id, self.mock_db)

        # Assertions
        assert report["overall_injury_risk_score"] == 35.0
        assert report["risk_category"] == "Medium"
        assert report["injury_specific_risks"]["ACL"] == 45.0
        assert len(report["movement_anomalies"]) == 1
        assert "ACWR history missing" in report["data_limitations"]
        assert self.mock_reports.insert_one.call_count == 1
        
        # Verify schema validation works
        validated = ReportResponse(**report)
        assert validated.overall_injury_risk_score == 35.0
        print("Test 1 Passed: Reports compile and validate against schemas.")

    @async_test
    async def test_report_compilation_missing_m3(self):
        """
        2. Test compilation fails if Milestone 3 risk score is missing.
        """
        self.mock_reports.find_one = AsyncMock(return_value=None)
        self.mock_sessions.find_one = AsyncMock(return_value={
            "_id": ObjectId(self.session_id),
            "processing_status": "completed"
        })
        self.mock_athletes.find_one = AsyncMock(return_value={"athlete_id": self.athlete_id})
        
        # Missing risk scores
        self.mock_scores.find_one = AsyncMock(return_value=None)

        with self.assertRaises(ValueError) as ctx:
            await ReportService.generate_report(self.athlete_id, self.session_id, self.mock_db)
        
        assert "Milestone 3 analysis has not been performed" in str(ctx.exception)
        print("Test 2 Passed: Exception raised when Milestone 3 database is missing.")

    @async_test
    async def test_history_creation_and_duplicates(self):
        """
        5. Test history creation.
        6. Test duplicate history prevention.
        """
        self.mock_history.find_one = AsyncMock(return_value=None)
        self.mock_history.insert_one = AsyncMock()

        self.mock_sessions.find_one = AsyncMock(return_value={
            "_id": ObjectId(self.session_id),
            "completed_at": datetime.now(timezone.utc)
        })

        self.mock_scores.find_one = AsyncMock(return_value={
            "overall_injury_risk_score": 45.0,
            "risk_category": "High",
            "athlete_health_score": 55.0,
            "movement_quality_score": 60.0,
            "score_breakdown": {
                "fatigue_factor": {"score": 25.0}
            }
        })

        self.mock_anoms.find = MagicMock()
        self.mock_anoms.find().to_list = AsyncMock(return_value=[])
        self.mock_preds.find = MagicMock()
        self.mock_preds.find().to_list = AsyncMock(return_value=[])

        # Run sync
        history = await HistoryService.sync_session_to_history(self.athlete_id, self.session_id, self.mock_db)
        
        assert history["injury_risk_score"] == 45.0
        assert history["risk_category"] == "High"
        assert self.mock_history.insert_one.call_count == 1

        # Test duplicate: running again returns existing without inserting again
        self.mock_history.find_one = AsyncMock(return_value=history)
        dup_history = await HistoryService.sync_session_to_history(self.athlete_id, self.session_id, self.mock_db)
        
        assert dup_history["session_id"] == self.session_id
        assert self.mock_history.insert_one.call_count == 1 # Stays 1
        print("Test 3 Passed: History synced correctly and duplicate runs bypassed.")

    @async_test
    async def test_critical_alerts_notifications(self):
        """
        7. Test notification generation.
        8. Test critical-risk notification.
        """
        self.mock_notifications.insert_many = AsyncMock()

        # Mock Critical risk score
        self.mock_scores.find_one = AsyncMock(return_value={
            "overall_injury_risk_score": 85.0,
            "risk_category": "Critical",
            "score_breakdown": {
                "fatigue_factor": {"score": 65.0}
            }
        })

        # Mock some critical anomalies
        self.mock_anoms.find = MagicMock()
        self.mock_anoms.find().to_list = AsyncMock(return_value=[
            {"anomaly_type": "knee_valgus", "severity": "Critical", "joint": "Knee"}
        ])

        alerts = await NotificationService.generate_notifications(self.athlete_id, self.session_id, self.mock_db)

        # Should generate multiple alerts: Critical risk, Anomalies, Fatigue, and Completed
        assert len(alerts) == 4
        
        # Verify Critical alert details
        crit_alert = [a for a in alerts if a["notification_type"] == "Critical risk detected"][0]
        assert crit_alert["severity"] == "Critical"
        
        # Verify fatigue alert
        fatigue_alert = [a for a in alerts if a["notification_type"] == "Increased fatigue"][0]
        assert fatigue_alert["severity"] == "Medium"

        # Validate with schema
        validated = NotificationResponse(**crit_alert)
        assert validated.severity == "Critical"
        print("Test 4 Passed: Critical alert thresholds trigger correct notifications.")

    @async_test
    async def test_duplicate_notification_prevention(self):
        """
        14. Test duplicate notification prevention.
        """
        self.mock_notifications.insert_many = AsyncMock()

        # Mock Risk score
        self.mock_scores.find_one = AsyncMock(return_value={
            "overall_injury_risk_score": 10.0,
            "risk_category": "Low",
            "score_breakdown": {}
        })

        self.mock_anoms.find = MagicMock()
        self.mock_anoms.find().to_list = AsyncMock(return_value=[])

        # Mock existing notifications of type 'New analysis completed'
        mock_cursor = MagicMock()
        mock_cursor.to_list = AsyncMock(return_value=[
            {"session_id": self.session_id, "notification_type": "New analysis completed"}
        ])
        self.mock_notifications.find = MagicMock(return_value=mock_cursor)

        alerts = await NotificationService.generate_notifications(self.athlete_id, self.session_id, self.mock_db)

        # Should generate 0 alerts because 'New analysis completed' is already present
        assert len(alerts) == 0
        print("Test 5 Passed: Duplicate notification generation is prevented.")

if __name__ == "__main__":
    unittest.main()
