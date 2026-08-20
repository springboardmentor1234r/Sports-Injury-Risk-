import sys
import os
import asyncio
import unittest
from unittest.mock import AsyncMock, MagicMock, patch
from bson import ObjectId
from datetime import datetime, timezone, timedelta

# Resolve paths
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))

from routers.reports import generate_report, get_report
from routers.history import get_history
from routers.notifications import get_notifications, mark_notification_read, evaluate_notifications

def async_test(coro):
    def wrapper(*args, **kwargs):
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(coro(*args, **kwargs))
    return wrapper

class TestMilestone4Routers(unittest.TestCase):
    def setUp(self):
        self.mock_db = MagicMock()
        self.athlete_id = "60c72b2f9b1d8b2bad034339"
        self.session_id = "60c72b2f9b1d8b2bad034341"
        self.notification_id = "60c72b2f9b1d8b2bad034349"

        self.current_athlete = {
            "_id": self.athlete_id,
            "name": "Test Athlete",
            "role": "Athlete"
        }

        self.current_coach = {
            "_id": "60c72b2f9b1d8b2bad034338",
            "name": "Coach Name",
            "role": "Coach"
        }

        # Mock collection setups
        self.mock_sessions = MagicMock()
        self.mock_reports = MagicMock()
        self.mock_athletes = MagicMock()
        self.mock_notifications = MagicMock()
        self.mock_history = MagicMock()

        def mock_getitem(name):
            if name == "AnalysisSessions": return self.mock_sessions
            elif name == "AthleteReports": return self.mock_reports
            elif name == "athletes": return self.mock_athletes
            elif name == "Notifications": return self.mock_notifications
            elif name == "AnalysisHistory": return self.mock_history
            return MagicMock()

        self.mock_db.__getitem__.side_effect = mock_getitem

    @async_test
    @patch("routers.reports.verify_session_permission")
    @patch("routers.reports.ReportService.generate_report")
    async def test_report_generation_success(self, mock_gen, mock_verify):
        """
        1. Test report generation succeeds.
        """
        mock_verify.return_value = {"athlete_id": self.athlete_id}
        mock_gen.return_value = {
            "athlete_id": self.athlete_id,
            "session_id": self.session_id,
            "report_id": "rep_123",
            "overall_injury_risk_score": 10.0,
            "risk_category": "Low",
            "injury_specific_risks": {},
            "movement_anomalies": [],
            "biomechanical_summary": {},
            "movement_quality_score": 90.0,
            "athlete_health_score": 90.0,
            "recommendations": [],
            "data_limitations": [],
            "analysis_timestamp": datetime.now(timezone.utc),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }

        res = await generate_report(
            session_id=self.session_id,
            current_user=self.current_athlete,
            db=self.mock_db
        )
        assert res["overall_injury_risk_score"] == 10.0
        assert res["risk_category"] == "Low"
        mock_gen.assert_called_once()
        print("Router Test 1 Passed: Report generation route triggers compiler successfully.")

    @async_test
    @patch("routers.reports.verify_session_permission")
    async def test_report_retrieval_success(self, mock_verify):
        """
        2. Test report retrieval works.
        """
        mock_verify.return_value = {}
        self.mock_reports.find_one = AsyncMock(return_value={
            "_id": ObjectId(),
            "athlete_id": self.athlete_id,
            "session_id": self.session_id,
            "report_id": "rep_123",
            "overall_injury_risk_score": 10.0,
            "risk_category": "Low",
            "injury_specific_risks": {},
            "movement_anomalies": [],
            "biomechanical_summary": {},
            "movement_quality_score": 90.0,
            "athlete_health_score": 90.0,
            "recommendations": [],
            "data_limitations": [],
            "analysis_timestamp": datetime.now(timezone.utc),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        })

        res = await get_report(
            session_id=self.session_id,
            current_user=self.current_athlete,
            db=self.mock_db
        )
        assert res["report_id"] == "rep_123"
        print("Router Test 2 Passed: Report retrieval route reads cached logs.")

    @async_test
    @patch("routers.history.verify_athlete_permission")
    @patch("services.history_service.HistoryService.get_athlete_history")
    async def test_history_retrieval_and_filtering(self, mock_get_hist, mock_verify):
        """
        4. Test history retrieval works.
        5. Test date filtering works.
        """
        mock_verify.return_value = {}
        
        base_date = datetime.now(timezone.utc)
        mock_get_hist.return_value = [
            {"session_id": "s1", "analysis_date": base_date - timedelta(days=5), "injury_risk_score": 10.0, "risk_category": "Low", "movement_quality_score": 90.0, "athlete_health_score": 90.0, "fatigue_risk_score": 0.0, "major_anomalies": [], "major_injury_risks": [], "created_at": base_date},
            {"session_id": "s2", "analysis_date": base_date - timedelta(days=2), "injury_risk_score": 20.0, "risk_category": "Low", "movement_quality_score": 80.0, "athlete_health_score": 80.0, "fatigue_risk_score": 0.0, "major_anomalies": [], "major_injury_risks": [], "created_at": base_date},
            {"session_id": "s3", "analysis_date": base_date, "injury_risk_score": 30.0, "risk_category": "Low", "movement_quality_score": 70.0, "athlete_health_score": 70.0, "fatigue_risk_score": 0.0, "major_anomalies": [], "major_injury_risks": [], "created_at": base_date}
        ]

        # Fetch all
        res = await get_history(
            athlete_id=self.athlete_id,
            current_user=self.current_athlete,
            db=self.mock_db
        )
        assert len(res["history"]) == 3

        # Filter with start_date
        start = base_date - timedelta(days=3)
        res_filtered = await get_history(
            athlete_id=self.athlete_id,
            start_date=start,
            current_user=self.current_athlete,
            db=self.mock_db
        )
        assert len(res_filtered["history"]) == 2
        print("Router Test 3 Passed: History retrieval and date window filters pass.")

    @async_test
    @patch("routers.notifications.verify_athlete_permission")
    @patch("services.notification_service.NotificationService.get_athlete_notifications")
    async def test_notification_retrieval_and_filtering(self, mock_get_notif, mock_verify):
        """
        6. Test notification retrieval works.
        7. Test unread filtering works.
        """
        mock_verify.return_value = {}
        mock_get_notif.return_value = [
            {"athlete_id": self.athlete_id, "session_id": self.session_id, "notification_type": "Alert", "title": "Alert 1", "message": "Msg", "severity": "Low", "read_status": False, "created_at": datetime.now(timezone.utc)}
        ]
        
        # Mock counting cursor
        mock_cursor = MagicMock()
        mock_cursor.to_list = AsyncMock(return_value=[{}])
        self.mock_notifications.find = MagicMock(return_value=mock_cursor)

        res = await get_notifications(
            athlete_id=self.athlete_id,
            unread_only=True,
            current_user=self.current_athlete,
            db=self.mock_db
        )
        assert len(res["notifications"]) == 1
        assert res["unread_count"] == 1
        print("Router Test 4 Passed: Notifications list and unread count retrieve successfully.")

    @async_test
    @patch("routers.notifications.verify_athlete_permission")
    @patch("services.notification_service.NotificationService.mark_notification_as_read")
    async def test_mark_notification_as_read(self, mock_mark, mock_verify):
        """
        8. Test mark-as-read works.
        """
        mock_verify.return_value = {}
        self.mock_notifications.find_one = AsyncMock(return_value={
            "_id": ObjectId(self.notification_id),
            "athlete_id": self.athlete_id,
            "session_id": self.session_id,
            "notification_type": "Alert",
            "title": "Alert 1",
            "message": "Msg",
            "severity": "Low",
            "read_status": False,
            "created_at": datetime.now(timezone.utc)
        })
        mock_mark.return_value = True

        res = await mark_notification_read(
            notification_id=self.notification_id,
            current_user=self.current_athlete,
            db=self.mock_db
        )
        assert res["read_status"] is True
        print("Router Test 5 Passed: Marking notification read modifies status field.")

    @async_test
    @patch("routers.notifications.verify_session_permission")
    @patch("services.notification_service.NotificationService.generate_notifications")
    async def test_evaluate_notifications(self, mock_gen, mock_verify):
        """
        10. Test evaluate notifications endpoint.
        """
        mock_verify.return_value = {"athlete_id": self.athlete_id}
        mock_gen.return_value = [
            {"athlete_id": self.athlete_id, "session_id": self.session_id, "notification_type": "Completed", "title": "Done", "message": "Done msg", "severity": "Low", "read_status": False, "created_at": datetime.now(timezone.utc)}
        ]

        res = await evaluate_notifications(
            session_id=self.session_id,
            current_user=self.current_athlete,
            db=self.mock_db
        )
        assert len(res) == 1
        assert res[0]["notification_type"] == "Completed"
        print("Router Test 6 Passed: Evaluating completed analysis dispatches notifications.")

if __name__ == "__main__":
    unittest.main()
