import pytest
from unittest.mock import patch, MagicMock
from src.worker.search_tasks import sync_athlete_to_es
import elasticsearch.exceptions

@patch("src.worker.search_tasks.get_es_client")
@patch("src.worker.search_tasks.get_user_by_id")
@patch("src.worker.search_tasks.get_db_connection")
def test_sync_athlete_to_es_success(mock_get_db, mock_get_user, mock_get_es):
    mock_es = MagicMock()
    mock_get_es.return_value = mock_es
    
    mock_get_user.return_value = {
        "id": 1,
        "full_name": "Test Athlete",
        "email": "athlete@example.com",
        "profile_picture_url": None
    }
    
    mock_db = MagicMock()
    mock_get_db.return_value = mock_db
    mock_db["athlete_profiles"].find_one.return_value = {"sport": "Basketball"}
    mock_db["sessions"].find_one.return_value = {"risk_data": {"risk_category": "High"}}
    
    # Call the indexing function
    success = sync_athlete_to_es(athlete_id=1, coach_id=2)
    
    assert success is True
    
    # Verify the Elasticsearch client was called
    mock_es.index.assert_called_once()
    call_args = mock_es.index.call_args[1]
    assert call_args["index"] == "athletes"
    assert call_args["id"] == str(1)
    assert call_args["document"]["full_name"] == "Test Athlete"
    assert call_args["document"]["sport"] == "Basketball"
    assert call_args["document"]["risk_category"] == "High"

@patch("src.worker.search_tasks.get_es_client")
def test_sync_athlete_to_es_connection_error(mock_get_es):
    mock_es = MagicMock()
    mock_get_es.return_value = mock_es
    
    # Simulate an Elasticsearch connection failure (though autoretry handles it, the inner code throws or returns False)
    mock_get_es.return_value = None
    
    success = sync_athlete_to_es(athlete_id=1, coach_id=2)
    
    assert success is False
