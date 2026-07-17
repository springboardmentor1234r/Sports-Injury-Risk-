import csv
import os


class BiomechanicsExporter:

    def export(self, angle_data, filename="running_joint_angles.csv"):

        output_dir = "Milestone 3/outputs"
        os.makedirs(output_dir, exist_ok=True)

        filepath = os.path.join(output_dir, filename)

        if len(angle_data) == 0:
            print("No data to export.")
            return

        with open(filepath, "w", newline="") as csvfile:

            fieldnames = angle_data[0].keys()

            writer = csv.DictWriter(
                csvfile,
                fieldnames=fieldnames
            )

            writer.writeheader()
            writer.writerows(angle_data)

        print("\n========== BIOMECHANICS EXPORTED ==========")
        print(f"Records Saved : {len(angle_data)}")
        print(f"CSV File      : {filepath}")

        return filepath


if __name__ == "__main__":

    exporter = BiomechanicsExporter()

    sample = [
        {
            "frame": 1,
            "left_knee": 165.2,
            "right_knee": 168.7,
            "left_hip": 175.3,
            "right_hip": 171.4,
            "left_elbow": 142.6,
            "right_elbow": 150.3,
            "left_shoulder": 24.1,
            "right_shoulder": 28.4
        }
    ]

    exporter.export(sample)