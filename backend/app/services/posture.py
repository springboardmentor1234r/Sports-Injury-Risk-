import os
import json


class PostureAssessmentService:

    def analyze(self, angles_file, output_folder):

        os.makedirs(output_folder, exist_ok=True)

        with open(angles_file, "r") as f:
            angles = json.load(f)

        scores = []

        for frame in angles.values():

            left_back = frame.get("left_hip", 180)
            right_back = frame.get("right_hip", 180)

            score = (left_back + right_back) / 2
            scores.append(score)

        posture_score = round(sum(scores) / len(scores), 2)

        if posture_score >= 160:
            posture = "Excellent"

        elif posture_score >= 140:
            posture = "Good"

        elif posture_score >= 120:
            posture = "Average"

        else:
            posture = "Poor"

        result = {
            "posture_score": posture_score,
            "posture": posture
        }

        output_file = os.path.join(
            output_folder,
            "posture.json"
        )

        with open(output_file, "w") as f:
            json.dump(result, f, indent=4)

        print("\nPosture Assessment Completed")
        print(f"Posture Score : {posture_score}")

        return {
            "posture_score": posture_score,
            "posture": posture,
            "output_file": output_file
        }