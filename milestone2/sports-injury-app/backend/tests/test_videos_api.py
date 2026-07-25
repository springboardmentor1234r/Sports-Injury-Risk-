"""
tests/test_videos_api.py
---------------------------
Integration tests for the video upload -> background processing -> analysis
pipeline, exercised through the real FastAPI endpoints and the real
background task function.

We mock ONLY `pose_estimation.process_video` and `.get_video_metadata` --
the actual MediaPipe neural network call -- with deterministic fake frame
data. Everything else in this file is real: file upload and disk I/O, the
Video/VideoFrame database models, the background task orchestration, the
real biomechanics.summarize_video aggregation running on the fake frame
data, and every permission check.

Why mock the ML call at all, given pose_estimation was already verified
against a real photo during development? Two reasons: (1) a real test video
containing a real, identifiable person raises copyright/consent questions
that don't belong in a bundled test fixture, and (2) this keeps the suite
fast and deterministic for CI, independent of MediaPipe's model behavior.
The real-detection behavior is something you should see for yourself once,
by hand, in the app -- the guide walks through exactly that.
"""

import io
import time
from unittest.mock import patch
from fastapi.testclient import TestClient


def register_and_login(client, email, role, password="pass1234"):
    r = client.post("/auth/register", json={"full_name": email.split("@")[0], "email": email, "password": password, "role": role})
    assert r.status_code == 201, r.text
    r = client.post("/auth/login", data={"username": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def fake_process_video(input_path, annotated_output_path, model_complexity=1):
    """Stands in for real MediaPipe processing: yields 20 frames, with a pose
    detected (and a plausible, slightly-varying landmark set) in all but 2 of them,
    and actually writes a placeholder file to annotated_output_path so the
    'annotated video exists on disk' behavior is still genuinely tested."""
    import os
    os.makedirs(os.path.dirname(annotated_output_path), exist_ok=True)
    with open(annotated_output_path, "wb") as f:
        f.write(b"fake annotated video bytes")

    from app.services.pose_estimation import LANDMARK_NAMES

    for i in range(20):
        pose_detected = i not in (5, 12)  # simulate a couple of low-confidence frames
        landmarks = None
        if pose_detected:
            landmarks = [{"x": 0.5, "y": 0.5, "z": 0.0, "visibility": 0.9} for _ in LANDMARK_NAMES]
            hip_idx = LANDMARK_NAMES.index("left_hip")
            knee_idx = LANDMARK_NAMES.index("left_knee")
            ankle_idx = LANDMARK_NAMES.index("left_ankle")
            landmarks[hip_idx] = {"x": 0.5, "y": 0.5, "z": 0.0, "visibility": 0.95}
            landmarks[knee_idx] = {"x": 0.5 + (i * 0.005), "y": 0.7, "z": 0.0, "visibility": 0.95}
            landmarks[ankle_idx] = {"x": 0.5, "y": 0.9, "z": 0.0, "visibility": 0.95}
        yield {
            "frame_number": i,
            "timestamp_seconds": round(i / 10, 4),
            "pose_detected": pose_detected,
            "landmarks": landmarks,
        }


def fake_get_video_metadata(input_path):
    return {"fps": 10.0, "frame_count": 20, "duration_seconds": 2.0}


@patch("app.routers.videos.pose_estimation.process_video", side_effect=fake_process_video)
@patch("app.routers.videos.pose_estimation.get_video_metadata", side_effect=fake_get_video_metadata)
def test_full_upload_and_analysis_pipeline(mock_meta, mock_process, client: TestClient, sample_video_bytes):
    athlete_token = register_and_login(client, "athlete_video@test.com", "athlete")
    coach_token = register_and_login(client, "coach_video@test.com", "coach")
    physio_token = register_and_login(client, "physio_video@test.com", "physiotherapist")

    ah = {"Authorization": f"Bearer {athlete_token}"}
    ch = {"Authorization": f"Bearer {coach_token}"}
    ph = {"Authorization": f"Bearer {physio_token}"}

    profile_id = client.get("/athletes/me", headers=ah).json()["id"]

    r = client.post(
        f"/athletes/{profile_id}/videos",
        headers=ah,
        data={"activity_type": "running"},
        files={"file": ("test_clip.mp4", io.BytesIO(sample_video_bytes), "video/mp4")},
    )
    assert r.status_code == 201, r.text
    video = r.json()
    video_id = video["id"]
    assert video["activity_type"] == "running"

    # Background task timing varies noticeably by OS/machine (thread scheduling
    # under Starlette's TestClient has been observed to be slower to kick off
    # on Windows than on Linux/macOS) -- 30 seconds is a generous ceiling for
    # what should normally finish in well under a second with mocked processing.
    status = None
    for _ in range(60):
        r = client.get(f"/athletes/{profile_id}/videos/{video_id}", headers=ah)
        status = r.json()["status"]
        if status in ("completed", "failed"):
            break
        time.sleep(0.5)

    assert status == "completed", f"Video processing did not complete: {r.json()}"
    completed_video = r.json()
    assert completed_video["frame_count"] == 20
    assert completed_video["analyzed_frame_count"] == 18  # 20 frames minus the 2 simulated misses

    r = client.get(f"/athletes/{profile_id}/videos/{video_id}/analysis", headers=ah)
    assert r.status_code == 200, r.text
    analysis = r.json()
    assert analysis["joint_angles"]["left_knee_angle"] is not None
    assert analysis["joint_angles"]["left_knee_angle"]["sample_count"] == 18

    r = client.get(f"/athletes/{profile_id}/videos/{video_id}/frames", headers=ah)
    assert r.status_code == 200
    frames = r.json()
    assert len(frames) == 20
    assert frames[5]["pose_detected"] is False

    r = client.get(f"/athletes/{profile_id}/videos/{video_id}/annotated", headers=ah)
    assert r.status_code == 200
    assert r.content == b"fake annotated video bytes"

    r = client.get(f"/athletes/{profile_id}/videos/{video_id}", headers=ch)
    assert r.status_code == 200

    r = client.get(f"/athletes/{profile_id}/videos", headers=ph)
    assert r.status_code == 200
    assert len(r.json()) == 1


@patch("app.routers.videos.pose_estimation.process_video", side_effect=fake_process_video)
@patch("app.routers.videos.pose_estimation.get_video_metadata", side_effect=fake_get_video_metadata)
def test_second_athlete_cannot_see_first_athletes_video(mock_meta, mock_process, client: TestClient, sample_video_bytes):
    athlete_token = register_and_login(client, "owner@test.com", "athlete")
    ah = {"Authorization": f"Bearer {athlete_token}"}
    profile_id = client.get("/athletes/me", headers=ah).json()["id"]

    r = client.post(
        f"/athletes/{profile_id}/videos", headers=ah, data={"activity_type": "squatting"},
        files={"file": ("clip.mp4", io.BytesIO(sample_video_bytes), "video/mp4")},
    )
    video_id = r.json()["id"]

    other_token = register_and_login(client, "intruder@test.com", "athlete")
    oh = {"Authorization": f"Bearer {other_token}"}
    r = client.get(f"/athletes/{profile_id}/videos/{video_id}", headers=oh)
    assert r.status_code == 403


def test_rejects_unsupported_file_type(client: TestClient):
    athlete_token = register_and_login(client, "badfile@test.com", "athlete")
    ah = {"Authorization": f"Bearer {athlete_token}"}
    profile_id = client.get("/athletes/me", headers=ah).json()["id"]

    r = client.post(
        f"/athletes/{profile_id}/videos", headers=ah, data={"activity_type": "other"},
        files={"file": ("not_a_video.txt", io.BytesIO(b"hello"), "text/plain")},
    )
    assert r.status_code == 400


@patch("app.routers.videos.pose_estimation.process_video", side_effect=fake_process_video)
@patch("app.routers.videos.pose_estimation.get_video_metadata", side_effect=fake_get_video_metadata)
def test_physiotherapist_can_upload_for_an_athlete(mock_meta, mock_process, client: TestClient, sample_video_bytes):
    athlete_token = register_and_login(client, "athlete_pt@test.com", "athlete")
    physio_token = register_and_login(client, "pt_upload@test.com", "physiotherapist")
    ah = {"Authorization": f"Bearer {athlete_token}"}
    ph = {"Authorization": f"Bearer {physio_token}"}
    profile_id = client.get("/athletes/me", headers=ah).json()["id"]

    r = client.post(
        f"/athletes/{profile_id}/videos", headers=ph, data={"activity_type": "jumping"},
        files={"file": ("clip.mp4", io.BytesIO(sample_video_bytes), "video/mp4")},
    )
    assert r.status_code == 201


@patch("app.routers.videos.pose_estimation.process_video", side_effect=fake_process_video)
@patch("app.routers.videos.pose_estimation.get_video_metadata", side_effect=fake_get_video_metadata)
def test_delete_video_removes_it(mock_meta, mock_process, client: TestClient, sample_video_bytes):
    athlete_token = register_and_login(client, "deleter@test.com", "athlete")
    ah = {"Authorization": f"Bearer {athlete_token}"}
    profile_id = client.get("/athletes/me", headers=ah).json()["id"]

    r = client.post(
        f"/athletes/{profile_id}/videos", headers=ah, data={"activity_type": "other"},
        files={"file": ("clip.mp4", io.BytesIO(sample_video_bytes), "video/mp4")},
    )
    video_id = r.json()["id"]

    r = client.delete(f"/athletes/{profile_id}/videos/{video_id}?profile_id={profile_id}", headers=ah)
    assert r.status_code == 204

    r = client.get(f"/athletes/{profile_id}/videos/{video_id}", headers=ah)
    assert r.status_code == 404


def test_analysis_returns_404_for_nonexistent_video(client: TestClient):
    athlete_token = register_and_login(client, "pending@test.com", "athlete")
    ah = {"Authorization": f"Bearer {athlete_token}"}
    profile_id = client.get("/athletes/me", headers=ah).json()["id"]
    fake_video_id = "00000000-0000-0000-0000-000000000000"
    r = client.get(f"/athletes/{profile_id}/videos/{fake_video_id}/analysis", headers=ah)
    assert r.status_code == 404
