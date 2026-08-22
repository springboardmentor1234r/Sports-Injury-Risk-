import os
from pathlib import Path

TEST_DB = Path(__file__).with_name("kineticguard_test.db")
if TEST_DB.exists():
    TEST_DB.unlink()
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402
from app.services.analyzer import analyze_video  # noqa: E402


def test_analyzer_returns_brief_weighted_assessment(tmp_path):
    video = tmp_path / "drill.mp4"
    video.write_bytes(b"not-a-real-video-but-a-valid-analysis-fixture")
    result = analyze_video(video, "Running", "high", "previous ankle sprain")
    assert 0 <= result["overall_risk"] <= 100
    assert result["risk_level"] in {"low", "moderate", "high", "critical"}
    assert set(result["injury_probabilities"]) == {"acl_injury", "hamstring_injury", "ankle_sprain", "lower_back_injury", "overuse_injury"}
    assert result["recommendations"]


def test_athlete_end_to_end_upload_alert_and_exports():
    client = TestClient(app)
    registration = client.post("/auth/register", json={"full_name": "Asha Runner", "email": "asha@example.com", "password": "safe-password-1", "role": "athlete"})
    assert registration.status_code == 201
    login = client.post("/auth/login", data={"username": "asha@example.com", "password": "safe-password-1"})
    assert login.status_code == 200
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    assert client.get("/athletes/me", headers=headers).status_code == 200
    upload = client.post("/videos/upload", headers=headers, data={"activity": "Running"}, files={"file": ("running.mp4", b"sample-video-fixture", "video/mp4")})
    assert upload.status_code == 201, upload.text
    analysis_id = upload.json()["id"]
    assert upload.json()["result"]["overall_risk"] >= 0
    assert client.get("/dashboard/overview", headers=headers).status_code == 200
    assert client.get("/notifications", headers=headers).json()
    assert client.get(f"/reports/analysis/{analysis_id}/csv", headers=headers).status_code == 200
    report = client.get(f"/reports/analysis/{analysis_id}/pdf", headers=headers)
    assert report.status_code == 200
    assert report.content.startswith(b"%PDF")
