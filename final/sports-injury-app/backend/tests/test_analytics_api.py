"""
tests/test_analytics_api.py
------------------------------
Integration tests for the team-wide analytics overview.
"""

from fastapi.testclient import TestClient


def register_and_login(client, email, role, password="pass1234"):
    r = client.post("/auth/register", json={"full_name": email.split("@")[0], "email": email, "password": password, "role": role})
    assert r.status_code == 201, r.text
    r = client.post("/auth/login", data={"username": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def test_athlete_cannot_access_team_overview(client: TestClient):
    token = register_and_login(client, "athlete_an@test.com", "athlete")
    r = client.get("/analytics/team-overview", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403


def test_coach_can_access_team_overview(client: TestClient):
    register_and_login(client, "athlete1_an@test.com", "athlete")
    register_and_login(client, "athlete2_an@test.com", "athlete")
    coach_token = register_and_login(client, "coach_an@test.com", "coach")

    r = client.get("/analytics/team-overview", headers={"Authorization": f"Bearer {coach_token}"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["total_athletes"] == 2
    assert data["assessed_athletes"] == 0
    assert len(data["athletes"]) == 2


def test_overview_sorts_highest_risk_first_and_unassessed_last(client: TestClient):
    a1_token = register_and_login(client, "low_risk@test.com", "athlete")
    a2_token = register_and_login(client, "high_risk@test.com", "athlete")
    register_and_login(client, "unassessed@test.com", "athlete")
    physio_token = register_and_login(client, "physio_an@test.com", "physiotherapist")
    coach_token = register_and_login(client, "coach_an2@test.com", "coach")

    a1_profile = client.get("/athletes/me", headers={"Authorization": f"Bearer {a1_token}"}).json()["id"]
    a2_profile = client.get("/athletes/me", headers={"Authorization": f"Bearer {a2_token}"}).json()["id"]
    ph = {"Authorization": f"Bearer {physio_token}"}

    # a2 gets a severe recent injury logged -> should score higher than a1 (no data)
    client.post(f"/athletes/{a2_profile}/injuries", headers=ph, json={
        "body_part": "knee", "injury_type": "ACL Tear", "severity": "severe",
        "recovery_status": "active", "date_occurred": "2026-07-01",
    })
    client.post(f"/athletes/{a1_profile}/risk-assessments", headers=ph)
    client.post(f"/athletes/{a2_profile}/risk-assessments", headers=ph)

    r = client.get("/analytics/team-overview", headers={"Authorization": f"Bearer {coach_token}"})
    data = r.json()
    assert data["assessed_athletes"] == 2
    scored_rows = [a for a in data["athletes"] if a["latest_score"] is not None]
    assert scored_rows[0]["full_name"] == "high_risk"  # highest risk score first
    assert data["athletes"][-1]["full_name"] == "unassessed"  # no assessment -> last
    assert data["athletes"][-1]["latest_score"] is None


def test_band_counts_reflect_computed_assessments(client: TestClient):
    athlete_token = register_and_login(client, "bandcount@test.com", "athlete")
    physio_token = register_and_login(client, "physio_bc@test.com", "physiotherapist")
    coach_token = register_and_login(client, "coach_bc@test.com", "coach")
    profile_id = client.get("/athletes/me", headers={"Authorization": f"Bearer {athlete_token}"}).json()["id"]

    client.post(f"/athletes/{profile_id}/risk-assessments", headers={"Authorization": f"Bearer {physio_token}"})

    r = client.get("/analytics/team-overview", headers={"Authorization": f"Bearer {coach_token}"})
    data = r.json()
    assert sum(data["band_counts"].values()) == 1
    assert data["band_counts"]["low"] == 1  # no data -> defaults to low per compute_overall_risk
