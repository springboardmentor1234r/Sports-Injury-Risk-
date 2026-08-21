import json
import os


def save_report(
    filename,
    video_info,
    joint_angles,
    movement_analysis,
    injury_risk,
    injury_prediction,
    movement_anomalies,
    risk_score,
    recommendations,
):
    report = {
        "filename": filename,

        "video_info": video_info,

        "joint_angles": joint_angles,

        "movement_analysis": movement_analysis,

        "injury_risk": injury_risk,

        "risk_score": risk_score,

        "injury_prediction": injury_prediction,

        "movement_anomalies": movement_anomalies,

        "recommendations": recommendations,
    }

    report_name = filename.rsplit(".", 1)[0] + "_report.json"

    report_path = os.path.join("uploads", report_name)

    with open(report_path, "w") as f:
        json.dump(report, f, indent=4)

    return report_path