from fastapi import APIRouter
from fastapi.responses import FileResponse
import subprocess
import os
import sys
import pandas as pd
from pose_engine.risk_prediction import predict_risk
from pose_engine.movement_analyzer import detect_issues
from pose_engine.exercise_recommendation import recommend_exercises

router = APIRouter()


# -----------------------------
# Analyze Uploaded Video
# -----------------------------
@router.post("/analyze-video")
def analyze_video():

    latest_video_file = "datasets/latest_video.txt"

    if not os.path.exists(latest_video_file):
        return {
            "status": "error",
            "message": "No video uploaded yet."
        }

    with open(latest_video_file, "r") as f:
        video_path = f.read().strip()

    # Path to pose_estimation.py
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    script_path = os.path.join(
        project_root,
        "pose_engine",
        "pose_estimation.py"
    )

    # Run pose estimation
    result = subprocess.run(
        [sys.executable, script_path, video_path],
        capture_output=True,
        text=True
    )

    print("STDOUT:", result.stdout)
    print("STDERR:", result.stderr)

    if result.returncode != 0:
        return {
            "status": "error",
            "message": result.stderr
        }

    return {
        "status": "success",
        "message": "Video analyzed successfully",
        "video": video_path,
        "report": "reports/analysis_report.txt",
        "csv": "reports/joint_angles.csv"
    }


# -----------------------------
# Download Report
# -----------------------------
@router.get("/download-report")
def download_report():

    report_path = "reports/analysis_report.txt"

    if os.path.exists(report_path):
        return FileResponse(
            report_path,
            media_type="text/plain",
            filename="analysis_report.txt"
        )

    return {
        "status": "error",
        "message": "Report not found"
    }


# -----------------------------
# Dashboard Data
# -----------------------------
@router.get("/dashboard-data")
def dashboard_data():

    csv_path = "reports/joint_angles.csv"

    if not os.path.exists(csv_path):
        return {
            "status": "error",
            "message": "joint_angles.csv not found"
        }

    df = pd.read_csv(csv_path)

    latest = df.iloc[-1]
    risk, score, issues,exercises  = predict_risk(
        int(latest["Right Knee"]),
        int(latest["Left Knee"]),
        int(latest["Right Elbow"]),
        int(latest["Left Elbow"]),
        int(latest["Right Hip"]),
        int(latest["Left Hip"])
    )
    issues = detect_issues(
        int(latest["Right Knee"]),
        int(latest["Left Knee"]),
        int(latest["Right Elbow"]),
        int(latest["Left Elbow"]),
        int(latest["Right Hip"]),
        int(latest["Left Hip"])
    )
    exercises = recommend_exercises(issues)

    return {
        "status": "success",
        "right_knee": int(latest["Right Knee"]),
        "left_knee": int(latest["Left Knee"]),
        "right_elbow": int(latest["Right Elbow"]),
        "left_elbow": int(latest["Left Elbow"]),
        "right_hip": int(latest["Right Hip"]),
        "left_hip": int(latest["Left Hip"]),
        "risk": risk,
        "score": score,
        "issues": issues,
        "exercises": exercises
    }
