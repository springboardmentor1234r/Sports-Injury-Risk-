import json
import os
import sys


sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from athlete.athlete_profile import get_athlete_profile

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

REPORTS_DIR = os.path.join(BASE_DIR, "..", "reports")
OUTPUTS_DIR = os.path.join(BASE_DIR, "..", "outputs")

os.makedirs(REPORTS_DIR, exist_ok=True)
os.makedirs(OUTPUTS_DIR, exist_ok=True)


def generate_report(left_knees, right_knees, risk_scores,movement_score,movement_quality,ml_prediction,running_phase,symmetry,recommendations):

    athlete = get_athlete_profile()
    report = {

        "Athlete": athlete,

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
        },

        "Movement Score": movement_score,

        "Movement Quality": movement_quality,

        "Prediction": ml_prediction,

        "Running Phase": running_phase,

        "Symmetry": {
            "knee": symmetry["Knee Status"],
            "elbow": symmetry["Elbow Status"]
        },

        "Recommendations": recommendations
    }
    
    report_json = os.path.join(REPORTS_DIR, "report.json")

    with open(report_json, "w", encoding="utf-8") as file:
        json.dump(report, file, indent=4)

        print("\nReport Generated Successfully!")


def save_report(angles, risk_score, risk_messages,movement_score,movement_quality,symmetry,recommendations):

    report_txt = os.path.join(OUTPUTS_DIR, "report.txt")

    with open(report_txt, "w", encoding="utf-8") as file:

        file.write("===== AI Sports Injury Report =====\n\n")
        athlete = get_athlete_profile()

        file.write("Athlete Details\n")
        file.write("-------------------------\n")
        file.write(f"Name      : {athlete['name']}\n")
        file.write(f"Age       : {athlete['age']}\n")
        file.write(f"Gender    : {athlete['gender']}\n")
        file.write(f"Sport     : {athlete['sport']}\n")
        file.write(f"Position  : {athlete['position']}\n")
        file.write(f"Height    : {athlete['height_cm']} cm\n")
        file.write(f"Weight    : {athlete['weight_kg']} kg\n\n")

        file.write("Joint Angles\n")
        file.write("-------------------------\n")

        for joint, angle in angles.items():
            file.write(f"{joint}: {int(angle)}°\n")

        file.write("\n")

        file.write(f"Risk Score: {risk_score}%\n\n")
        file.write(f"Movement Score: {movement_score}/100\n")
        file.write(f"Movement Quality: {movement_quality}\n\n")
        file.write("Symmetry Analysis\n")
        file.write("-------------------------\n")

        file.write(f"Knee Difference : {symmetry['Knee Difference']}°\n")
        file.write(f"Knee Status     : {symmetry['Knee Status']}\n")

        file.write(f"Elbow Difference: {symmetry['Elbow Difference']}°\n")
        file.write(f"Elbow Status    : {symmetry['Elbow Status']}\n\n")

        file.write("Warnings\n")
        file.write("-------------------------\n")

        if len(risk_messages) == 0:
            file.write("No injury risk detected.\n")
        else:
            for message in risk_messages:
                file.write(message + "\n")

        file.write("\n===============================\n")
        file.write("\nRecommendations\n")
        file.write("-------------------------\n")

        for recommendation in recommendations:
            file.write(f"- {recommendation}\n")

    print("Text Report Saved Successfully!")