import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# Import your FastAPI app
# Adjust the import path if your app object is named differently or in a different file
from api.server import app

@pytest.fixture
def client():
    """
    Returns a TestClient instance for the FastAPI app.
    """
    return TestClient(app)

@pytest.fixture(autouse=True)
def mock_rate_limiter():
    """
    Mocks the slowapi rate limiter to prevent 429 Too Many Requests during tests.
    """
    with patch("slowapi.Limiter.limit", return_value=lambda x: x):
        yield

@pytest.fixture(autouse=True)
def mock_celery_tasks():
    """
    Mocks Celery tasks that might be called asynchronously during API requests (e.g., sending emails).
    """
    with patch("api.routers.auth_router.send_otp_signup_task.apply_async") as mock_signup, \
         patch("api.routers.auth_router.send_welcome_email_task.apply_async") as mock_welcome:
        yield {
            "signup_otp": mock_signup,
            "welcome": mock_welcome
        }
