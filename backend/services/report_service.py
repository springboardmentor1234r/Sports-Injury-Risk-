import json
import os


def save_report(filename, joint_angles, movement_analysis, injury_risk):
    report = {
        "filename": filename,
        "joint_angles": joint_angles,
        "movement_analysis": movement_analysis,
        "injury_risk": injury_risk
    }

    report_name = filename.rsplit(".", 1)[0] + "_report.json"
    report_path = os.path.join("uploads", report_name)

    with open(report_path, "w") as f:
        json.dump(report, f, indent=4)

    return report_path