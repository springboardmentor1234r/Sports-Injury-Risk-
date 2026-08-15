import pytest
from unittest.mock import patch, MagicMock
from src.worker.scheduled_tasks import reassessment_reminder_task
import datetime

@patch("src.worker.scheduled_tasks.get_db_connection")
@patch("src.worker.scheduled_tasks.insert_notification")
def test_reassessment_reminder_task(mock_insert_notification, mock_get_db):
    mock_db = MagicMock()
    mock_get_db.return_value = mock_db
    
    # Mock the aggregation pipeline to return 2 athletes who need reassessment
    old_date = datetime.datetime.utcnow() - datetime.timedelta(days=15)
    mock_db["sessions"].aggregate.return_value = [
        {"_id": 1, "last_session": old_date},
        {"_id": 2, "last_session": old_date}
    ]
    
    # Run task synchronously
    result = reassessment_reminder_task.apply()
    
    # Verify aggregation was called
    mock_db["sessions"].aggregate.assert_called_once()
    
    # Verify insert_notification was called twice (once for each athlete)
    assert mock_insert_notification.call_count == 2
    
    # Check the args of the first call
    call_args = mock_insert_notification.call_args_list[0][1]
    assert call_args["user_id"] == 1
    assert call_args["type"] == "reassessment_reminder"
    assert "Time for a Check-in" in call_args["title"]
    
    assert result.result == "Sent 2 reassessment reminders"

@patch("src.worker.scheduled_tasks.get_db_connection")
@patch("src.worker.scheduled_tasks.insert_notification")
def test_reassessment_reminder_task_no_users(mock_insert_notification, mock_get_db):
    mock_db = MagicMock()
    mock_get_db.return_value = mock_db
    
    # Mock no users found
    mock_db["sessions"].aggregate.return_value = []
    
    result = reassessment_reminder_task.apply()
    
    # Verify no notifications were sent
    mock_insert_notification.assert_not_called()
    assert result.result == "Sent 0 reassessment reminders"
