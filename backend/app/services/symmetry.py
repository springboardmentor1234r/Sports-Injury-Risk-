import os
import json


class SymmetryService:

    def analyze(self, angles_file, output_folder):

        os.makedirs(output_folder, exist_ok=True)

        with open(angles_file, "r") as f:
            angles = json.load(f)

        total_difference = 0
        comparisons = 0

        symmetry = {}

        joint_pairs = [
            ("left_shoulder", "right_shoulder"),
            ("left_elbow", "right_elbow"),
            ("left_hip", "right_hip"),
            ("left_knee", "right_knee"),
            ("left_ankle", "right_ankle")
        ]

        for frame, joints in angles.items():

            frame_result = {}

            for left, right in joint_pairs:

                if left in joints and right in joints:

                    diff = abs(joints[left] - joints[right])

                    frame_result[f"{left}_vs_{right}"] = round(diff, 2)

                    total_difference += diff
                    comparisons += 1

            symmetry[frame] = frame_result

        average_difference = (
            total_difference / comparisons
            if comparisons > 0 else 0
        )

        symmetry_score = round(max(0, 100 - average_difference), 2)

        output_file = os.path.join(
            output_folder,
            "symmetry.json"
        )

        with open(output_file, "w") as f:
            json.dump(symmetry, f, indent=4)

        print("\nMovement Symmetry Completed")
        print(f"Symmetry Score : {symmetry_score}")

        return {
            "symmetry_score": symmetry_score,
            "output_file": output_file
        }