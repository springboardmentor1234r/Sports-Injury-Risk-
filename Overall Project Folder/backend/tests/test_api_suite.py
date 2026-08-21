import sys
import os
import asyncio
from fastapi.testclient import TestClient

# Add app to sys path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.seed_12_athletes import seed_data

client = TestClient(app)

# Ensure seeded data is present
asyncio.run(seed_data())

def test_system_health():
    response = client.get("/api/system/health")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "Athletiq AI Backend"
    assert data["status"] == "healthy"

def test_athlete_registration_and_auth():
    email = f"test_athlete_{os.urandom(4).hex()}@athletiq.ai"
    reg_data = {
        "full_name": "Test Athlete Alpha",
        "email": email,
        "password": "Password123!",
        "confirm_password": "Password123!",
        "role": "athlete",
        "phone_number": "+15550199"
    }
    res = client.post("/api/auth/register", json=reg_data)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "athlete"
    assert data["user"]["athlete_id"] is not None

def test_strict_athlete_data_isolation():
    # Register Athlete A
    email_a = f"athlete_a_{os.urandom(4).hex()}@athletiq.ai"
    res_a = client.post("/api/auth/register", json={
        "full_name": "Athlete A",
        "email": email_a,
        "password": "Password123!",
        "role": "athlete"
    })
    token_a = res_a.json()["access_token"]
    ath_id_a = res_a.json()["user"]["athlete_id"]

    # Register Athlete B
    email_b = f"athlete_b_{os.urandom(4).hex()}@athletiq.ai"
    res_b = client.post("/api/auth/register", json={
        "full_name": "Athlete B",
        "email": email_b,
        "password": "Password123!",
        "role": "athlete"
    })
    token_b = res_b.json()["access_token"]

    # Athlete B attempts to request Athlete A's private data -> MUST return 403 Forbidden!
    headers_b = {"Authorization": f"Bearer {token_b}"}
    forbidden_res = client.get(f"/api/athletes/{ath_id_a}", headers=headers_b)
    assert forbidden_res.status_code == 403, f"Expected 403 Forbidden, got {forbidden_res.status_code}"
    assert "Forbidden" in forbidden_res.json()["detail"]

def test_coach_dashboard_sees_new_athlete():
    # Register a new athlete
    email = f"new_ath_{os.urandom(4).hex()}@athletiq.ai"
    reg_res = client.post("/api/auth/register", json={
        "full_name": "Dynamic Coach Test Athlete",
        "email": email,
        "password": "Password123!",
        "role": "athlete"
    })
    assert reg_res.status_code == 200

    # Login as Coach
    coach_login = client.post("/api/auth/login", json={
        "email": "coach@athletiq.ai",
        "password": "Password123!"
    })
    assert coach_login.status_code == 200, coach_login.text
    coach_token = coach_login.json()["access_token"]

    # Coach fetches all registered athletes
    headers_coach = {"Authorization": f"Bearer {coach_token}"}
    ath_res = client.get("/api/athletes", headers=headers_coach)
    assert ath_res.status_code == 200
    athletes = ath_res.json()
    names = [a["name"] for a in athletes]
    assert "Dynamic Coach Test Athlete" in names
