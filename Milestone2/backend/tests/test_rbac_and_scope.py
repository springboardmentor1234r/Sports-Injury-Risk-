import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.models.sql_models import UserRole

client = TestClient(app)

def get_auth_header(user_id: int, role: str):
    token = create_access_token(subject=user_id, role=role)
    return {"Authorization": f"Bearer {token}"}

def test_unauthenticated_requests_return_401():
    res = client.get("/api/v1/coach/roster")
    assert res.status_code == 401

    res = client.get("/api/v1/physio/patients")
    assert res.status_code == 401

    res = client.get("/api/v1/admin/users")
    assert res.status_code == 401

    res = client.get("/api/v1/sports-scientist/datasets")
    assert res.status_code == 401

def test_cross_role_access_returns_403_forbidden():
    # Login as Athlete (user_id 1 in seeded DB or mock ID 999)
    athlete_headers = get_auth_header(user_id=1, role="Athlete")

    # Athlete attempting to access Coach roster -> 403
    res = client.get("/api/v1/coach/roster", headers=athlete_headers)
    assert res.status_code == 403
    assert "Operation restricted" in res.json()["detail"]

    # Athlete attempting to access Physio patients -> 403
    res = client.get("/api/v1/physio/patients", headers=athlete_headers)
    assert res.status_code == 403

    # Athlete attempting to access Admin users -> 403
    res = client.get("/api/v1/admin/users", headers=athlete_headers)
    assert res.status_code == 403

    # Athlete attempting to access Sports Scientist datasets -> 403
    res = client.get("/api/v1/sports-scientist/datasets", headers=athlete_headers)
    assert res.status_code == 403

def test_coach_roster_and_enrollment_flow():
    coach_headers = get_auth_header(user_id=2, role="Coach")
    
    # 1. Fetch roster
    res = client.get("/api/v1/coach/roster", headers=coach_headers)
    assert res.status_code == 200
    roster = res.json()
    assert isinstance(roster, list)

    # 2. Fetch available athletes
    res_avail = client.get("/api/v1/coach/available-athletes", headers=coach_headers)
    assert res_avail.status_code == 200
    assert isinstance(res_avail.json(), list)

    # 3. Enroll athlete ID 1
    res_enroll = client.post("/api/v1/coach/enroll/1", headers=coach_headers)
    assert res_enroll.status_code == 200

    # 4. Unenroll athlete ID 1
    res_unenroll = client.delete("/api/v1/coach/enroll/1", headers=coach_headers)
    assert res_unenroll.status_code == 200

def test_physio_patients_and_assignment_flow():
    physio_headers = get_auth_header(user_id=3, role="Physiotherapist")
    
    # 1. Fetch patients
    res = client.get("/api/v1/physio/patients", headers=physio_headers)
    assert res.status_code == 200
    patients = res.json()
    assert isinstance(patients, list)

    # 2. Assign patient ID 1
    res_assign = client.post("/api/v1/physio/assign/1", headers=physio_headers)
    assert res_assign.status_code == 200

    # 3. Unassign patient ID 1
    res_unassign = client.delete("/api/v1/physio/assign/1", headers=physio_headers)
    assert res_unassign.status_code == 200

def test_sports_scientist_datasets_endpoint():
    scientist_headers = get_auth_header(user_id=4, role="Sports Scientist")
    res = client.get("/api/v1/sports-scientist/datasets", headers=scientist_headers)
    assert res.status_code == 200
    data = res.json()
    assert "movement_logs_count" in data

def test_admin_users_and_role_update_endpoint():
    admin_headers = get_auth_header(user_id=5, role="Administrator")
    res = client.get("/api/v1/admin/users", headers=admin_headers)
    assert res.status_code == 200
    users = res.json()
    assert isinstance(users, list)
    assert len(users) >= 1

    # Test patch role
    target_user_id = users[0]["id"]
    patch_res = client.patch(
        f"/api/v1/admin/users/{target_user_id}/role",
        headers=admin_headers,
        json={"role": "Athlete"}
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["new_role"] == "Athlete"
