import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_video_upload_and_biomechanics_pipeline():
    # 1. Test video upload with mock file content
    fake_video_bytes = b"FAKE_MP4_VIDEO_HEADER_AND_STREAM_DATA"
    file_data = ("sample_movement.mp4", io.BytesIO(fake_video_bytes), "video/mp4")

    upload_response = client.post(
        "/api/v1/videos/upload",
        files={"file": file_data},
        data={"movement_type": "Jumping"}
    )

    assert upload_response.status_code == 201
    res_json = upload_response.json()
    assert res_json["status"] == "success"
    assert "video" in res_json
    video_id = res_json["video"]["video_id"]
    assert video_id.startswith("VID-")
    assert res_json["video"]["movement_type"] == "Jumping"

    # 2. Test list videos endpoint
    list_response = client.get("/api/v1/videos")
    assert list_response.status_code == 200
    assert list_response.json()["count"] >= 1

    # 3. Test video metadata by video_id
    get_vid_res = client.get(f"/api/v1/videos/{video_id}")
    assert get_vid_res.status_code == 200
    assert get_vid_res.json()["video_id"] == video_id

    # 4. Trigger Biomechanical Analysis
    analyze_res = client.post(f"/api/v1/biomechanics/analyze/{video_id}")
    assert analyze_res.status_code == 200
    report = analyze_res.json()["report"]
    assert report["video_id"] == video_id
    assert "summary_metrics" in report
    assert "risk_badges" in report

    # 5. Fetch Biomechanics Metrics GET endpoint
    metrics_res = client.get(f"/api/v1/biomechanics/metrics/{video_id}")
    assert metrics_res.status_code == 200
    assert metrics_res.json()["video_id"] == video_id
