"""
tests/test_risk_assessments_api.py
--------------------------------------
Integration tests for the risk assessment API: creating an assessment from
real database state (injury records, training load, video analysis),
listing history, role-based write/read access.
"""

import io
import time
from datetime import date, timedelta
from unittest.mock import patch
from fastapi.testclient import TestClient


def register_and_login(client, email, role, password="pass1234"):
    r = client.post("/auth/register", json={"full_name": email.split("@")[0], "email": email, "password": password, "role": role})
    assert r.status_code == 201, r.text
    r = client.post("/auth/login", data={"username": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def test_physiotherapist_can_create_assessment_with_no_data(client: TestClient):
    """An athlete with zero logged data should still get a valid (low, 'insufficient
    data' flagged) assessment rather than an error -- the system should degrade
    gracefully, not crash, when there's nothing to go on yet."""
    athlete_token = register_and_login(client, "fresh@test.com", "athlete")
    physio_token = register_and_login(client, "physio_ra@test.com", "physiotherapist")
    ah = {"Authorization": f"Bearer {athlete_token}"}
    ph = {"Authorization": f"Bearer {physio_token}"}
    profile_id = client.get("/athletes/me", headers=ah).json()["id"]

    r = client.post(f"/athletes/{profile_id}/risk-assessments", headers=ph)
    assert r.status_code == 201, r.text
    data = r.json()
    assert data["risk_band"] == "low"
    assert data["data_completeness_warnings"]


def test_coach_cannot_create_assessment(client: TestClient):
    athlete_token = register_and_login(client, "athlete_ra@test.com", "athlete")
    coach_token = register_and_login(client, "coach_ra@test.com", "coach")
    ah = {"Authorization": f"Bearer {athlete_token}"}
    ch = {"Authorization": f"Bearer {coach_token}"}
    profile_id = client.get("/athletes/me", headers=ah).json()["id"]

    r = client.post(f"/athletes/{profile_id}/risk-assessments", headers=ch)
    assert r.status_code == 403


def test_assessment_reflects_severe_recent_injury_and_training_spike(client: TestClient):
    athlete_token = register_and_login(client, "risky@test.com", "athlete")
    physio_token = register_and_login(client, "physio_risky@test.com", "physiotherapist")
    coach_token = register_and_login(client, "coach_risky@test.com", "coach")
    ah = {"Authorization": f"Bearer {athlete_token}"}
    ph = {"Authorization": f"Bearer {physio_token}"}
    ch = {"Authorization": f"Bearer {coach_token}"}
    profile_id = client.get("/athletes/me", headers=ah).json()["id"]

    # Log a recent severe knee injury
    r = client.post(f"/athletes/{profile_id}/injuries", headers=ph, json={
        "body_part": "knee", "injury_type": "ACL Tear", "severity": "severe",
        "recovery_status": "active", "date_occurred": (date.today() - timedelta(days=20)).isoformat(),
    })
    assert r.status_code == 201, r.text

    # Log 28 days of low training load, then a big spike in the last week
    for d in range(8, 28):
        r = client.post(f"/athletes/{profile_id}/training-load", headers=ch, json={
            "session_date": (date.today() - timedelta(days=d)).isoformat(),
            "session_type": "Recovery", "duration_minutes": 30, "intensity_rpe": 4,
        })
        assert r.status_code == 201, r.text
    for d in range(0, 7):
        r = client.post(f"/athletes/{profile_id}/training-load", headers=ch, json={
            "session_date": (date.today() - timedelta(days=d)).isoformat(),
            "session_type": "Match", "duration_minutes": 100, "intensity_rpe": 9,
        })
        assert r.status_code == 201, r.text

    r = client.post(f"/athletes/{profile_id}/risk-assessments", headers=ph)
    assert r.status_code == 201, r.text
    data = r.json()

    assert data["historical_injury_score"] > 60  # recent severe active injury
    assert data["training_load_score"] > 60      # training spike (high ACWR)
    assert data["risk_band"] in ("high", "critical")
    assert len(data["breakdown"]) > 0


def test_list_and_latest_endpoints(client: TestClient):
    athlete_token = register_and_login(client, "history@test.com", "athlete")
    physio_token = register_and_login(client, "physio_hist@test.com", "physiotherapist")
    ah = {"Authorization": f"Bearer {athlete_token}"}
    ph = {"Authorization": f"Bearer {physio_token}"}
    profile_id = client.get("/athletes/me", headers=ah).json()["id"]

    r = client.get(f"/athletes/{profile_id}/risk-assessments/latest", headers=ah)
    assert r.status_code == 404  # none computed yet

    client.post(f"/athletes/{profile_id}/risk-assessments", headers=ph)
    time.sleep(0.01)
    second = client.post(f"/athletes/{profile_id}/risk-assessments", headers=ph)
    assert second.status_code == 201

    r = client.get(f"/athletes/{profile_id}/risk-assessments", headers=ah)
    assert r.status_code == 200
    assert len(r.json()) == 2

    r = client.get(f"/athletes/{profile_id}/risk-assessments/latest", headers=ah)
    assert r.status_code == 200
    assert r.json()["id"] == second.json()["id"]


def test_athlete_cannot_view_another_athletes_assessment(client: TestClient):
    athlete_token = register_and_login(client, "owner_ra@test.com", "athlete")
    physio_token = register_and_login(client, "physio_owner@test.com", "physiotherapist")
    ah = {"Authorization": f"Bearer {athlete_token}"}
    ph = {"Authorization": f"Bearer {physio_token}"}
    profile_id = client.get("/athletes/me", headers=ah).json()["id"]
    client.post(f"/athletes/{profile_id}/risk-assessments", headers=ph)

    other_token = register_and_login(client, "intruder_ra@test.com", "athlete")
    oh = {"Authorization": f"Bearer {other_token}"}
    r = client.get(f"/athletes/{profile_id}/risk-assessments", headers=oh)
    assert r.status_code == 403


@patch("app.routers.videos.pose_estimation.process_video")
@patch("app.routers.videos.pose_estimation.get_video_metadata")
def test_assessment_uses_completed_video_analysis(mock_meta, mock_process, client: TestClient):
    """Confirms the risk engine actually pulls from a completed video's stored
    frame data, end to end -- not just from injury/training-load records."""
    from app.services.pose_estimation import LANDMARK_NAMES

    def fake_frames(input_path, annotated_output_path, model_complexity=1):
        import os
        os.makedirs(os.path.dirname(annotated_output_path), exist_ok=True)
        with open(annotated_output_path, "wb") as f:
            f.write(b"fake")
        for i in range(10):
            landmarks = [{"x": 0.5, "y": 0.5, "z": 0.0, "visibility": 0.9} for _ in LANDMARK_NAMES]
            # place knee well off the hip-ankle line -> large deviation angle
            hip_idx = LANDMARK_NAMES.index("left_hip")
            knee_idx = LANDMARK_NAMES.index("left_knee")
            ankle_idx = LANDMARK_NAMES.index("left_ankle")
            landmarks[hip_idx] = {"x": 0.5, "y": 0.4, "z": 0.0, "visibility": 0.95}
            landmarks[knee_idx] = {"x": 0.7, "y": 0.7, "z": 0.0, "visibility": 0.95}  # displaced sideways
            landmarks[ankle_idx] = {"x": 0.5, "y": 1.0, "z": 0.0, "visibility": 0.95}
            yield {"frame_number": i, "timestamp_seconds": i / 10, "pose_detected": True, "landmarks": landmarks}

    mock_process.side_effect = fake_frames
    mock_meta.return_value = {"fps": 10.0, "frame_count": 10, "duration_seconds": 1.0}

    athlete_token = register_and_login(client, "videoflagged@test.com", "athlete")
    physio_token = register_and_login(client, "physio_vf@test.com", "physiotherapist")
    ah = {"Authorization": f"Bearer {athlete_token}"}
    ph = {"Authorization": f"Bearer {physio_token}"}
    profile_id = client.get("/athletes/me", headers=ah).json()["id"]

    r = client.post(
        f"/athletes/{profile_id}/videos", headers=ah, data={"activity_type": "squatting"},
        files={"file": ("clip.mp4", io.BytesIO(b"fake mp4 bytes"), "video/mp4")},
    )
    assert r.status_code == 201, r.text
    video_id = r.json()["id"]

    for _ in range(30):
        status = client.get(f"/athletes/{profile_id}/videos/{video_id}", headers=ah).json()["status"]
        if status == "completed":
            break
        time.sleep(0.3)
    assert status == "completed"

    r = client.post(f"/athletes/{profile_id}/risk-assessments", headers=ph)
    assert r.status_code == 201, r.text
    data = r.json()
    assert data["based_on_video_id"] == video_id
    assert data["biomechanical_score"] is not None
    assert data["biomechanical_score"] > 40  # large deviation angle should register as elevated
