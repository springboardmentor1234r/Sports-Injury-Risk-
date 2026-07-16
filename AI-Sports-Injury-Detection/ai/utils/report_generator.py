import json
import os

# Get the directory where this file is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

REPORTS_DIR = os.path.join(BASE_DIR, "..", "reports")
OUTPUTS_DIR = os.path.join(BASE_DIR, "..", "outputs")

os.makedirs(REPORTS_DIR, exist_ok=True)
os.makedirs(OUTPUTS_DIR, exist_ok=True)


def generate_report(left_knees, right_knees, risk_scores):

    report = {

        "Frames Analysed": len(left_knees),

        "Left Knee": {
            "Maximum": max(left_knees),
            "Minimum": min(left_knees),
            "Average": round(sum(left_knees) / len(left_knees), 2)
        },

        "Right Knee": {
            "Maximum": max(right_knees),
            "Minimum": min(right_knees),
            "Average": round(sum(right_knees) / len(right_knees), 2)
        },

        "Risk Score": {
            "Maximum": max(risk_scores),
            "Average": round(sum(risk_scores) / len(risk_scores), 2)
        }

    }

    report_json = os.path.join(REPORTS_DIR, "report.json")

    with open(report_json, "w", encoding="utf-8") as file:
        json.dump(report, file, indent=4)

    print("Report Generated Successfully!")


def save_report(angles, risk_score, risk_messages):

    report_txt = os.path.join(OUTPUTS_DIR, "report.txt")

    with open(report_txt, "w", encoding="utf-8") as file:

        file.write("===== AI Sports Injury Report =====\n\n")

        file.write("Joint Angles\n")
        file.write("-------------------------\n")

        for joint, angle in angles.items():
            file.write(f"{joint}: {int(angle)}°\n")

        file.write("\n")

        file.write(f"Risk Score: {risk_score}%\n\n")

        file.write("Warnings\n")
        file.write("-------------------------\n")

        if len(risk_messages) == 0:
            file.write("No injury risk detected.\n")
        else:
            for message in risk_messages:
                file.write(message + "\n")

        file.write("\n===============================\n")

    print("Text Report Saved Successfully!")