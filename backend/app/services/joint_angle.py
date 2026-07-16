import os
import json
import math


def calculate_angle(a, b, c):
    """
    Calculates the angle ABC (angle at point B)
    """

    ba = (
        a["x"] - b["x"],
        a["y"] - b["y"]
    )

    bc = (
        c["x"] - b["x"],
        c["y"] - b["y"]
    )

    dot_product = (
        ba[0] * bc[0] +
        ba[1] * bc[1]
    )

    magnitude_ba = math.sqrt(
        ba[0] ** 2 +
        ba[1] ** 2
    )

    magnitude_bc = math.sqrt(
        bc[0] ** 2 +
        bc[1] ** 2
    )

    if magnitude_ba == 0 or magnitude_bc == 0:
        return 0

    cosine = dot_product / (magnitude_ba * magnitude_bc)

    cosine = max(-1, min(1, cosine))

    angle = math.degrees(math.acos(cosine))

    return round(angle, 2)


class JointAngleService:

    def process(self, keypoints_folder, output_folder):

        os.makedirs(output_folder, exist_ok=True)

        results = {}

        json_files = sorted([
            file for file in os.listdir(keypoints_folder)
            if file.endswith(".json")
        ])

        for file in json_files:

            file_path = os.path.join(
                keypoints_folder,
                file
            )

            with open(file_path, "r") as f:
                data = json.load(f)

            landmarks = data["landmarks"]

            lm = {}

            for point in landmarks:
                lm[point["id"]] = point

            frame_angles = {

                "left_shoulder": calculate_angle(
                    lm[13], lm[11], lm[23]
                ),

                "right_shoulder": calculate_angle(
                    lm[14], lm[12], lm[24]
                ),

                "left_elbow": calculate_angle(
                    lm[11], lm[13], lm[15]
                ),

                "right_elbow": calculate_angle(
                    lm[12], lm[14], lm[16]
                ),

                "left_hip": calculate_angle(
                    lm[11], lm[23], lm[25]
                ),

                "right_hip": calculate_angle(
                    lm[12], lm[24], lm[26]
                ),

                "left_knee": calculate_angle(
                    lm[23], lm[25], lm[27]
                ),

                "right_knee": calculate_angle(
                    lm[24], lm[26], lm[28]
                ),

                "left_ankle": calculate_angle(
                    lm[25], lm[27], lm[31]
                ),

                "right_ankle": calculate_angle(
                    lm[26], lm[28], lm[32]
                )
            }

            results[data["frame"]] = frame_angles

        output_file = os.path.join(
            output_folder,
            "angles.json"
        )

        with open(output_file, "w") as f:
            json.dump(results, f, indent=4)

        print("\nJoint Angle Analysis Completed")
        print("Frames Processed :", len(results))
        print("Saved To :", output_file)

        return {
            "frames_processed": len(results),
            "output_file": output_file
        }