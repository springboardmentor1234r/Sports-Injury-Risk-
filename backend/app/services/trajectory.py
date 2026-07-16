import os
import json


class TrajectoryService:

    def generate_trajectory(self, keypoints_folder: str, output_folder: str):

        os.makedirs(output_folder, exist_ok=True)

        trajectory_data = {
            "Left Hip": [],
            "Right Hip": [],
            "Left Knee": [],
            "Right Knee": [],
            "Left Ankle": [],
            "Right Ankle": []
        }

        json_files = sorted([
            file for file in os.listdir(keypoints_folder)
            if file.endswith(".json")
        ])

        frame_count = 0

        for filename in json_files:

            file_path = os.path.join(keypoints_folder, filename)

            with open(file_path, "r") as f:
                data = json.load(f)

            landmarks = data["landmarks"]

            joints = {
                "Left Hip": 23,
                "Right Hip": 24,
                "Left Knee": 25,
                "Right Knee": 26,
                "Left Ankle": 27,
                "Right Ankle": 28
            }

            for joint_name, landmark_id in joints.items():

                landmark = landmarks[landmark_id]

                trajectory_data[joint_name].append({
                    "frame": frame_count + 1,
                    "x": landmark["x"],
                    "y": landmark["y"]
                })

            frame_count += 1

        output_file = os.path.join(output_folder, "trajectory.json")

        with open(output_file, "w") as f:
            json.dump(trajectory_data, f, indent=4)

        print("\nTrajectory Analysis Completed")
        print(f"Frames Processed : {frame_count}")
        print(f"Trajectory Saved : {output_file}")

        return {
            "frames_processed": frame_count,
            "joints_tracked": list(trajectory_data.keys()),
            "output_file": output_file
        }