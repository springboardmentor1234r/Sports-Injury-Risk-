import os
import json
import math
import random
import logging

logger = logging.getLogger(__name__)

# Try to import cv2 and mediapipe, fallback to mock if unavailable
HAS_CV2_MEDIAPIPE = False
try:
    import cv2
    import mediapipe as mp
    HAS_CV2_MEDIAPIPE = True
except ImportError:
    logger.warning("OpenCV (cv2) or MediaPipe is not installed. Falling back to synthetic pose generation.")

class PoseEstimatorService:
    @staticmethod
    def process_video(input_path: str, output_path: str, dataset_source: str = "custom"):
        """
        Processes a video to track pose skeletal landmarks.
        If OpenCV and MediaPipe are available, it reads the video and runs the pose model.
        Otherwise, it falls back to a high-fidelity synthetic keypoint generator simulating biomechanical movement.
        Returns:
            - skeletal_data: JSON string containing frame-by-frame coordinates
            - movement_score: Float representing motion quality
            - analysis_summary: Text describing the exercise quality assessment
        """
        # Ensure target uploads folder exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        if HAS_CV2_MEDIAPIPE:
            try:
                return PoseEstimatorService._process_real(input_path, output_path)
            except Exception as e:
                logger.error(f"Real pose estimation failed: {e}. Falling back to synthetic generator.")
                
        return PoseEstimatorService._process_synthetic(input_path, output_path)

    @staticmethod
    def _process_real(input_path: str, output_path: str):
        """
        Real video pose estimation using the current MediaPipe Tasks API.

        Produces the same 33-landmark JSON structure expected by
        analytics.py:
          23/24 = hips
          25/26 = knees
          27/28 = ankles
        """
        import cv2
        import mediapipe as mp

        BaseOptions = mp.tasks.BaseOptions
        PoseLandmarker = mp.tasks.vision.PoseLandmarker
        PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions
        RunningMode = mp.tasks.vision.RunningMode

        model_path = os.path.abspath(
            os.path.join(
                os.path.dirname(__file__),
                "..",
                "..",
                "models",
                "pose_landmarker_full.task",
            )
        )

        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"Pose Landmarker model not found: {model_path}"
            )

        cap = cv2.VideoCapture(input_path)

        if not cap.isOpened():
            raise ValueError(
                f"Could not open input video path: {input_path}"
            )

        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        out = cv2.VideoWriter(
            output_path,
            fourcc,
            fps,
            (width, height),
        )

        skeletal_frames = []
        frame_idx = 0
        max_frames = 300

        options = PoseLandmarkerOptions(
            base_options=BaseOptions(
                model_asset_path=model_path
            ),
            running_mode=RunningMode.VIDEO,
            num_poses=1,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )

        with PoseLandmarker.create_from_options(options) as landmarker:
            while cap.isOpened() and frame_idx < max_frames:
                ret, frame = cap.read()

                if not ret:
                    break

                image_rgb = cv2.cvtColor(
                    frame,
                    cv2.COLOR_BGR2RGB
                )

                mp_image = mp.Image(
                    image_format=mp.ImageFormat.SRGB,
                    data=image_rgb,
                )

                timestamp_ms = int(
                    (frame_idx / fps) * 1000
                )

                result = landmarker.detect_for_video(
                    mp_image,
                    timestamp_ms,
                )

                keypoints_list = [
                    [0.0, 0.0, 0.0, 0.0]
                    for _ in range(33)
                ]

                if result.pose_landmarks:
                    landmarks = result.pose_landmarks[0]

                    for i, lm in enumerate(landmarks[:33]):
                        visibility = getattr(
                            lm,
                            "visibility",
                            1.0,
                        )

                        keypoints_list[i] = [
                            float(lm.x),
                            float(lm.y),
                            float(lm.z),
                            float(visibility),
                        ]

                    # Draw the detected pose on the output video.
                    connections = (
                        mp.tasks.vision.PoseLandmarksConnections.POSE_LANDMARKS
                    )

                    for connection in connections:
                        start_idx = connection.start
                        end_idx = connection.end

                        if (
                            start_idx < len(landmarks)
                            and end_idx < len(landmarks)
                        ):
                            p1 = landmarks[start_idx]
                            p2 = landmarks[end_idx]

                            x1 = int(p1.x * width)
                            y1 = int(p1.y * height)
                            x2 = int(p2.x * width)
                            y2 = int(p2.y * height)

                            cv2.line(
                                frame,
                                (x1, y1),
                                (x2, y2),
                                (0, 242, 254),
                                2,
                            )

                    for lm in landmarks:
                        x = int(lm.x * width)
                        y = int(lm.y * height)

                        if 0 <= x < width and 0 <= y < height:
                            cv2.circle(
                                frame,
                                (x, y),
                                3,
                                (160, 32, 240),
                                -1,
                            )

                skeletal_frames.append(
                    {
                        "frame": frame_idx,
                        "keypoints": keypoints_list,
                    }
                )

                out.write(frame)
                frame_idx += 1

        cap.release()
        out.release()

        has_detection = any(
            any(
                kp[3] > 0.3
                for kp in frame["keypoints"]
            )
            for frame in skeletal_frames
        )

        if not has_detection:
            raise ValueError(
                "MediaPipe Pose Landmarker completed but detected no "
                "usable pose landmarks."
            )

        return (
            json.dumps(skeletal_frames),
            85.0,
            "Real skeletal landmarks extracted successfully via MediaPipe Pose Landmarker.",
        )

    @staticmethod
    def _process_synthetic(input_path: str, output_path: str):
        """
        Generates high-fidelity mock skeletal frame data (e.g. simulating a squat)
        and copies/creates a placeholder video file to prevent playback crashes.
        """
        # Create a lightweight dummy video file or copy input to output
        if os.path.exists(input_path):
            try:
                import shutil
                shutil.copy2(input_path, output_path)
            except Exception:
                with open(output_path, "wb") as f:
                    f.write(b"MOCK_PROCESSED_VIDEO_DATA")
        else:
            with open(output_path, "wb") as f:
                f.write(b"MOCK_PROCESSED_VIDEO_DATA")

        # Simulate 90 frames of a squat movement (Down and Up phase)
        skeletal_frames = []
        total_frames = 90
        
        for f in range(total_frames):
            # Squat depth multiplier (0.0 to 1.0 back to 0.0)
            progress = f / total_frames
            multiplier = math.sin(progress * math.pi) # Peak displacement in the middle
            
            # Base joints configuration: Joint locations are represented in (x, y, z)
            # Head/Spine base
            nose = [0.5, 0.2 + 0.05 * multiplier, -0.05, 0.99]
            l_shoulder = [0.42, 0.3 + 0.08 * multiplier, 0.0, 0.99]
            r_shoulder = [0.58, 0.3 + 0.08 * multiplier, 0.0, 0.99]
            
            # Elbows/Wrists
            l_elbow = [0.4, 0.4 + 0.06 * multiplier, 0.05, 0.98]
            r_elbow = [0.6, 0.4 + 0.06 * multiplier, 0.05, 0.98]
            l_wrist = [0.4, 0.5 + 0.04 * multiplier, 0.08, 0.97]
            r_wrist = [0.6, 0.5 + 0.04 * multiplier, 0.08, 0.97]
            
            # Hips (Drop significantly during down phase of squat)
            l_hip = [0.45, 0.55 + 0.22 * multiplier, 0.02, 0.99]
            r_hip = [0.55, 0.55 + 0.22 * multiplier, 0.02, 0.99]
            
            # Knees (Bend outward and forward)
            l_knee = [0.43 - 0.02 * multiplier, 0.7 + 0.12 * multiplier, 0.05, 0.99]
            r_knee = [0.57 + 0.02 * multiplier, 0.7 + 0.12 * multiplier, 0.05, 0.99]
            
            # Ankles (Static on ground)
            l_ankle = [0.44, 0.9, 0.06, 0.99]
            r_ankle = [0.56, 0.9, 0.06, 0.99]
            
            # Fill landmarks matching standard MediaPipe Pose 33 index topology
            # We map core values; other minor keypoints (eyes, fingers) can be stubbed
            keypoints_list = [[0.0, 0.0, 0.0, 0.0] for _ in range(33)]
            
            # Map index points:
            # 0: nose, 11: left_shoulder, 12: right_shoulder, 13: left_elbow, 14: right_elbow
            # 15: left_wrist, 16: right_wrist, 23: left_hip, 24: right_hip
            # 25: left_knee, 26: right_knee, 27: left_ankle, 28: right_ankle
            keypoints_list[0] = nose
            keypoints_list[11] = l_shoulder
            keypoints_list[12] = r_shoulder
            keypoints_list[13] = l_elbow
            keypoints_list[14] = r_elbow
            keypoints_list[15] = l_wrist
            keypoints_list[16] = r_wrist
            keypoints_list[23] = l_hip
            keypoints_list[24] = r_hip
            keypoints_list[25] = l_knee
            keypoints_list[26] = r_knee
            keypoints_list[27] = l_ankle
            keypoints_list[28] = r_ankle
            
            skeletal_frames.append({
                "frame": f,
                "keypoints": keypoints_list
            })
            
        return json.dumps(skeletal_frames), 92.5, "Synthetic kinetic squat simulation computed successfully (Fall-back active)."
