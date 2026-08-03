"""
Milestone 4 — "Implement testing and validations" (PDF section 13).

Exercises services/reports.py directly. Verifies the generated files are
structurally valid (real PDF / real xlsx bytes) and that missing data
never crashes report generation — an athlete with no completed videos
yet should still get a report, not a 500 error.
Run with: cd backend && pytest tests/ -v
"""

from datetime import datetime

from services.reports import (
    generate_video_pdf_report,
    generate_athlete_pdf_report,
    generate_athlete_excel_report,
)


class FakeVideo:
    activity_type = "sprinting"
    uploaded_at = datetime(2026, 7, 20, 10, 30)
    duration_seconds = 8.4
    status = "completed"
    id = 1


class FakeAthlete:
    sport = "Track & Field"
    position = "Sprinter"
    age = 24
    height = 178
    weight = 72
    training_load = "high, 6 sessions/week"


BIOMECH_REPORT = {
    "movement_quality_score": 68.4,
    "avg_trunk_lean": 9.2,
    "knee_valgus_asymmetry": 0.031,
    "movement_symmetry_score": 74.1,
}

RISK_ASSESSMENT = {
    "risk_category": "High",
    "overall_injury_risk_score": 71.2,
    "overall_athlete_health_score": 28.8,
    "biomechanical_deviation_score": 62.0,
    "historical_injury_score": 60.0,
    "movement_asymmetry_score": 55.0,
    "training_load_score": 75.0,
    "fatigue_score": 68.0,
    "injury_type_risks": {
        "ACL Injury Risk": 45.2,
        "Hamstring Injury Risk": 58.1,
        "Ankle Sprain Risk": 30.0,
        "Shoulder Injury Risk": 10.0,
        "Lower Back Injury Risk": 25.4,
        "Overuse Injury Risk": 66.3,
    },
    "anomalies_detected": [
        {"type": "fatigue", "severity": "high", "description": "Form degrades in the second half of the clip."},
    ],
    "recommendations": [
        {"category": "recovery", "title": "Prioritize Recovery", "description": "Add an extra rest day this week."},
    ],
}


def test_video_pdf_report_is_valid_pdf():
    buf = generate_video_pdf_report(FakeVideo(), FakeAthlete(), "Jordan Lee", BIOMECH_REPORT, RISK_ASSESSMENT)
    data = buf.getvalue()
    assert data[:4] == b"%PDF"
    assert len(data) > 500


def test_video_pdf_report_handles_missing_biomechanics_and_risk():
    # A video that's still processing (no biomechanics/risk yet) should
    # still produce a downloadable, valid PDF — not raise.
    buf = generate_video_pdf_report(FakeVideo(), FakeAthlete(), "Jordan Lee", None, None)
    assert buf.getvalue()[:4] == b"%PDF"


def test_athlete_pdf_report_is_valid_pdf():
    rows = [
        {**RISK_ASSESSMENT, "uploaded_at": datetime(2026, 7, 20), "activity_type": "sprinting"},
        {
            **RISK_ASSESSMENT,
            "uploaded_at": datetime(2026, 7, 10),
            "activity_type": "landing",
            "risk_category": "Moderate",
            "overall_injury_risk_score": 42.0,
        },
    ]
    buf = generate_athlete_pdf_report(FakeAthlete(), "Jordan Lee", rows)
    assert buf.getvalue()[:4] == b"%PDF"


def test_athlete_pdf_report_handles_no_videos_yet():
    buf = generate_athlete_pdf_report(FakeAthlete(), "Jordan Lee", [])
    assert buf.getvalue()[:4] == b"%PDF"


def test_athlete_excel_report_is_valid_xlsx():
    rows = [{**RISK_ASSESSMENT, "uploaded_at": datetime(2026, 7, 20), "activity_type": "sprinting"}]
    buf = generate_athlete_excel_report(FakeAthlete(), "Jordan Lee", rows)
    data = buf.getvalue()
    # .xlsx files are zip archives — "PK" magic bytes confirm a real archive.
    assert data[:2] == b"PK"
    assert len(data) > 1000


def test_athlete_excel_report_handles_no_videos_yet():
    buf = generate_athlete_excel_report(FakeAthlete(), "Jordan Lee", [])
    assert buf.getvalue()[:2] == b"PK"
