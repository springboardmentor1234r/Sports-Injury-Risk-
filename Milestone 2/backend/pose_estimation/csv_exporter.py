import csv
import os


class CSVExporter:

    def __init__(self, output_dir="Milestone 2/outputs"):

        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def export(self, landmarks, filename="landmarks.csv"):

        filepath = os.path.join(self.output_dir, filename)

        if len(landmarks) == 0:
            print("No landmarks to save.")
            return

        with open(filepath, "w", newline="") as csvfile:

            fieldnames = landmarks[0].keys()

            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

            writer.writeheader()
            writer.writerows(landmarks)

        print("\nCSV Saved Successfully!")
        print(filepath)

        return filepath