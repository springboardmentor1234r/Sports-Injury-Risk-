import os
import json


class RangeOfMotionService:

    def analyze(self, angles_file, output_folder):

        os.makedirs(output_folder, exist_ok=True)

        with open(angles_file, "r") as f:
            angles = json.load(f)

        rom = {}

        for frame, joints in angles.items():

            for joint, angle in joints.items():

                if joint not in rom:
                    rom[joint] = []

                rom[joint].append(angle)

        results = {}

        for joint, values in rom.items():

            results[joint] = {
                "minimum": round(min(values), 2),
                "maximum": round(max(values), 2),
                "range_of_motion": round(max(values) - min(values), 2)
            }

        output_file = os.path.join(
            output_folder,
            "rom.json"
        )

        with open(output_file, "w") as f:
            json.dump(results, f, indent=4)

        print("\nRange of Motion Analysis Completed")
        print(f"Joints Analyzed : {len(results)}")

        return {
            "joints_analyzed": len(results),
            "output_file": output_file
        }