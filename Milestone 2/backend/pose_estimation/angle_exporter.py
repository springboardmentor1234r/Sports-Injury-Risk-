import csv
import os


class AngleExporter:
    """
    Exports calculated joint angles to CSV.
    """

    def __init__(self, output_dir="Milestone 2/outputs"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def export(self, angle_data, filename="joint_angles.csv"):

        if not angle_data:
            print("No angle data to export.")
            return None

        filepath = os.path.join(self.output_dir, filename)

        fieldnames = [
            "frame",
            "left_knee_angle",
            "right_knee_angle"
        ]

        with open(filepath, "w", newline="") as csvfile:

            writer = csv.DictWriter(
                csvfile,
                fieldnames=fieldnames
            )

            writer.writeheader()
            writer.writerows(angle_data)

        print("\n========== ANGLES EXPORTED ==========")
        print(f"Records Saved : {len(angle_data)}")
        print(f"CSV File      : {filepath}")

        return filepath