import csv
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUTS = os.path.join(BASE_DIR, "..", "outputs")

os.makedirs(OUTPUTS, exist_ok=True)


def create_csv():

    file = open(
        os.path.join(OUTPUTS, "joint_angles.csv"),
        "w",
        newline=""
    )

    writer = csv.writer(file)

    writer.writerow([
        "Frame",
        "Left Elbow",
        "Right Elbow",
        "Left Knee",
        "Right Knee",
        "Risk Score"
    ])

    return file, writer


def write_frame(writer, frame_no, angles, risk_score):

    writer.writerow([
        frame_no,
        round(angles["Left Elbow"], 2),
        round(angles["Right Elbow"], 2),
        round(angles["Left Knee"], 2),
        round(angles["Right Knee"], 2),
        risk_score
    ])