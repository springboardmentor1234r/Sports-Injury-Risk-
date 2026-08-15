import pytest
from unittest.mock import patch, MagicMock
from src.worker.tasks import process_video_task

@patch("src.worker.tasks.run_pipeline")
@patch("src.worker.tasks.get_db_connection")
@patch("src.worker.tasks.sync_athlete_to_es")
def test_process_video_task_success(mock_sync_es, mock_get_db, mock_run_pipeline):
    # Setup mock MongoDB
    mock_db = MagicMock()
    mock_collection = MagicMock()
    mock_db.__getitem__.return_value = mock_collection
    mock_get_db.return_value = mock_db
    
    # Mock AI pipeline returning mock risk data
    mock_run_pipeline.return_value = {
        "final_risk_score": 85,
        "risk_category": "High"
    }
    
    # Execute the Celery task synchronously
    result = process_video_task.apply(kwargs={
        "file_path": "dummy_url.mp4",
        "athlete_id": "user_123",
        "video_name": "Test Video",
        "session_id": "session_123"
    })
    
    # 1. Verify DB was updated to "processing" initially, and then "completed"
    assert mock_collection.update_one.call_count >= 2
    
    # Extract the calls to update_one
    update_calls = mock_collection.update_one.call_args_list
    
    # Check the final update call (should mark as completed)
    final_update_args = update_calls[-1][0]
    assert final_update_args[0] == {"session_id": "session_123"}
    assert final_update_args[1]["$set"]["status"] == "completed"
    
    # 2. Verify AI pipeline was called
    mock_run_pipeline.assert_called_once_with("session_123")
    
    # 3. Verify Elasticsearch sync was triggered asynchronously
    mock_sync_es.apply_async.assert_called_once_with(args=["user_123"])
    
    # Verify task result
    assert result.result == {"status": "success", "session_id": "session_123"}

@patch("src.worker.tasks.run_pipeline")
@patch("src.worker.tasks.get_db_connection")
def test_process_video_task_failure(mock_get_db, mock_run_pipeline):
    mock_db = MagicMock()
    mock_collection = MagicMock()
    mock_db.__getitem__.return_value = mock_collection
    mock_get_db.return_value = mock_db
    
    # Mock AI pipeline throwing an exception
    mock_run_pipeline.side_effect = Exception("AI Pipeline Failed")
    
    # Execute task synchronously and expect an exception
    with pytest.raises(Exception):
        process_video_task.apply(kwargs={
            "file_path": "dummy_url.mp4",
            "athlete_id": "user_123",
            "video_name": "Test Video",
            "session_id": "session_123"
        }).get()
    
    # Verify DB status was updated to "error"
    update_calls = mock_collection.update_one.call_args_list
    final_update_args = update_calls[-1][0]
    assert final_update_args[0] == {"session_id": "session_123"}
    assert final_update_args[1]["$set"]["status"] == "error"
    assert "AI Pipeline Failed" in final_update_args[1]["$set"]["error_message"]
