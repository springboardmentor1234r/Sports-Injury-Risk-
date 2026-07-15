import csv
import os


class GaitDetector:
    """
    Detects gait phases from knee angle data.

    Simple heuristic:
    - Heel Strike  : knee > 160°
    - Mid Stance   : 140°–160°
    - Toe Off      : 90°–140°
    - Swing Phase  : < 90°
    """

    def __init__(self):
        pass

    def detect_phase(self, knee_angle):

        if knee_angle >= 160:
            return "Heel Strike"

        elif knee_angle >= 140:
            return "Mid Stance"

        elif knee_angle >= 90:
            return "Toe Off"

        else:
            return "Swing Phase"

    def process_csv(self, input_csv, output_csv):

        rows = []

        with open(input_csv, "r", newline="") as file:

            reader = csv.DictReader(file)

            for row in reader:

                left = float(row["left_knee"])
                right = float(row["right_knee"])

                row["left_phase"] = self.detect_phase(left)
                row["right_phase"] = self.detect_phase(right)

                rows.append(row)

        os.makedirs(os.path.dirname(output_csv), exist_ok=True)

        with open(output_csv, "w", newline="") as file:

            fieldnames = rows[0].keys()

            writer = csv.DictWriter(
                file,
                fieldnames=fieldnames
            )

            writer.writeheader()
            writer.writerows(rows)

        print("\n========== GAIT ANALYSIS COMPLETE ==========")
        print(f"Frames Analysed : {len(rows)}")
        print(f"Output File     : {output_csv}")


if __name__ == "__main__":

    INPUT = "Milestone 3/outputs/running_joint_angles.csv"
    OUTPUT = "Milestone 3/outputs/running_gait.csv"

    detector = GaitDetector()

    detector.process_csv(
        INPUT,
        OUTPUT
    )