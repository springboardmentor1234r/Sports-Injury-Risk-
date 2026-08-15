import pytest
from unittest.mock import patch

def test_send_signup_otp_success(client, mock_celery_tasks):
    # Mock the database check (user does not exist)
    with patch("api.routers.auth_router.get_user_by_email", return_value=None), \
         patch("api.routers.auth_router.store_otp", return_value=True):
         
        response = client.post(
            "/api/auth/send-signup-otp",
            json={"email": "test@example.com"}
        )
        
        assert response.status_code == 200
        assert response.json() == {"message": "OTP sent successfully"}
        mock_celery_tasks["signup_otp"].assert_called_once()

def test_send_signup_otp_existing_user(client):
    # Mock the database check (user exists)
    with patch("api.routers.auth_router.get_user_by_email", return_value={"id": 1, "email": "test@example.com"}):
        response = client.post(
            "/api/auth/send-signup-otp",
            json={"email": "test@example.com"}
        )
        
        assert response.status_code == 400
        assert response.json()["detail"] == "Email already registered"

def test_login_success(client):
    # Mock successful user lookup and password verification
    mock_db_user = {
        "id": 1, 
        "email": "test@example.com", 
        "password_hash": "hashed_pass", 
        "is_active": True
    }
    mock_full_user = {
        "id": 1, 
        "email": "test@example.com", 
        "full_name": "Test User",
        "profile_picture_url": None,
        "coach_code": None
    }
    
    with patch("api.routers.auth_router.get_user_by_email", return_value=mock_db_user), \
         patch("api.routers.auth_router.verify_password", return_value=True), \
         patch("api.routers.auth_router.get_user_roles", return_value=["athlete"]), \
         patch("api.routers.auth_router.get_user_by_id", return_value=mock_full_user):
         
        response = client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "correctpassword"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "test@example.com"
        assert data["user"]["roles"] == ["athlete"]

def test_login_invalid_password(client):
    mock_db_user = {
        "id": 1, 
        "email": "test@example.com", 
        "password_hash": "hashed_pass", 
        "is_active": True
    }
    
    with patch("api.routers.auth_router.get_user_by_email", return_value=mock_db_user), \
         patch("api.routers.auth_router.verify_password", return_value=False):
         
        response = client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "wrongpassword"}
        )
        
        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid credentials"
