import os
import json
import cv2
import mediapipe as mp

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils


class PoseEstimationService:

    def __init__(self):
        self.pose = mp_pose.Pose(
            static_image_mode=True,
            model_complexity=1,
            min_detection_confidence=0.5
        )

    def process_frames(self, input_folder: str, output_folder: str, keypoints_folder: str):

        os.makedirs(output_folder, exist_ok=True)
        os.makedirs(keypoints_folder, exist_ok=True)

        total_frames = 0
        poses_detected = 0
        keypoints_saved = 0

        image_files = sorted([
            file for file in os.listdir(input_folder)
            if file.lower().endswith((".jpg", ".jpeg", ".png"))
        ])

        print(f"\nProcessing {len(image_files)} images...")

        for filename in image_files:

            image_path = os.path.join(input_folder, filename)

            image = cv2.imread(image_path)

            if image is None:
                continue

            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

            results = self.pose.process(rgb_image)

            total_frames += 1

            if results.pose_landmarks:

                poses_detected += 1

                mp_drawing.draw_landmarks(
                    image,
                    results.pose_landmarks,
                    mp_pose.POSE_CONNECTIONS
                )

                landmarks = []

                for idx, landmark in enumerate(results.pose_landmarks.landmark):

                    landmarks.append({
                        "id": idx,
                        "x": landmark.x,
                        "y": landmark.y,
                        "z": landmark.z,
                        "visibility": landmark.visibility
                    })

                json_data = {
                    "frame": filename,
                    "total_landmarks": len(landmarks),
                    "landmarks": landmarks
                }

                json_name = filename.replace(".jpg", ".json").replace(".png", ".json").replace(".jpeg", ".json")

                json_path = os.path.join(
                    keypoints_folder,
                    json_name
                )

                with open(json_path, "w") as f:
                    json.dump(json_data, f, indent=4)

                keypoints_saved += 1

            output_path = os.path.join(
                output_folder,
                filename
            )

            cv2.imwrite(output_path, image)

        print("\nPose Estimation Completed")
        print(f"Frames Processed : {total_frames}")
        print(f"Poses Detected  : {poses_detected}")
        print(f"JSON Saved      : {keypoints_saved}")

        return {
            "frames_processed": total_frames,
            "poses_detected": poses_detected,
            "keypoints_saved": keypoints_saved
        }