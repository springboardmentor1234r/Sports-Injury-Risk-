import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    """Verify system root status endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "SIRD" in data["app"]

def test_system_metrics_unauthorized():
    """Verify protected system metrics endpoint requires authentication."""
    response = client.get("/api/system/metrics")
    assert response.status_code == 401  # Unauthorized without Bearer token

def test_notifications_unauthorized():
    """Verify notification routes require authentication."""
    response = client.get("/api/notifications/me")
    assert response.status_code == 401

def test_reports_pdf_unauthorized():
    """Verify PDF export requires authentication."""
    response = client.get("/api/reports/pdf/me")
    assert response.status_code == 401

def test_predictions_unauthorized():
    """Verify prediction endpoint requires authentication."""
    response = client.get("/api/predictions/me/latest")
    assert response.status_code == 401
