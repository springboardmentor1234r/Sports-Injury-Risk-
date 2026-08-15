import pytest
from unittest.mock import patch, MagicMock
from database.mongo_utils import insert_notification, save_chat_message

@patch("database.mongo_utils.get_db_connection")
def test_insert_notification_new(mock_get_db):
    # Setup mock MongoDB
    mock_db = MagicMock()
    mock_collection = MagicMock()
    mock_db.__getitem__.return_value = mock_collection
    mock_get_db.return_value = mock_db
    
    # Simulate that this idempotency_key does not exist
    mock_collection.find_one.return_value = None
    
    # Call the function
    insert_notification(
        user_id=1,
        type="test_alert",
        idempotency_key="unique_key_123",
        title="Test Title",
        message="Test Message"
    )
    
    # Verify it checked for the key first
    mock_collection.find_one.assert_called_once_with({"idempotency_key": "unique_key_123"})
    # Verify it inserted the new notification
    mock_collection.insert_one.assert_called_once()
    
    # Check inserted data
    inserted_doc = mock_collection.insert_one.call_args[0][0]
    assert inserted_doc["user_id"] == 1
    assert inserted_doc["title"] == "Test Title"
    assert inserted_doc["is_read"] is False

@patch("database.mongo_utils.get_db_connection")
def test_insert_notification_duplicate(mock_get_db):
    mock_db = MagicMock()
    mock_collection = MagicMock()
    mock_db.__getitem__.return_value = mock_collection
    mock_get_db.return_value = mock_db
    
    # Simulate that this idempotency_key ALREADY exists
    mock_collection.find_one.return_value = {"_id": "existing_id"}
    
    insert_notification(
        user_id=1,
        type="test_alert",
        idempotency_key="unique_key_123",
        title="Test Title",
        message="Test Message"
    )
    
    # Verify it checked for the key
    mock_collection.find_one.assert_called_once_with({"idempotency_key": "unique_key_123"})
    # Verify it DID NOT insert a duplicate
    mock_collection.insert_one.assert_not_called()

@patch("database.mongo_utils.get_db_connection")
def test_save_chat_message(mock_get_db):
    mock_db = MagicMock()
    mock_collection = MagicMock()
    mock_db.__getitem__.return_value = mock_collection
    mock_get_db.return_value = mock_db
    
    # Set the inserted_id to simulate successful DB write
    mock_insert_result = MagicMock()
    mock_insert_result.inserted_id = "test_object_id"
    mock_collection.insert_one.return_value = mock_insert_result
    
    result = save_chat_message(
        sender_id=1,
        receiver_id=2,
        message_text="Hello Coach!"
    )
    
    # Verify format of returned message
    assert result["sender_id"] == 1
    assert result["receiver_id"] == 2
    assert result["message"] == "Hello Coach!"
    assert result["is_read"] is False
    assert result["_id"] == "test_object_id"
