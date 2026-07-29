import os
import gc
import cv2
import time
import shutil
import subprocess
import mediapipe as mp

from app.services.angle_calculator import calculate_angle

from app.services.biomechanical_analysis import (
    calculate_rom,
    calculate_symmetry,
    hip_stability,
    balance_score,
    joint_alignment,
    calculate_movement_quality,
)

from app.services.risk_engine import calculate_risk


mp_pose = mp.solutions.pose
mp_draw = mp.solutions.drawing_utils


# ==========================================================
# MAIN FUNCTION
# ==========================================================

def analyze_pose(video_path: str, generate_video: bool = True):

    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise Exception(f"Cannot open video: {video_path}")

    total_frames = 0
    pose_frames = 0

    left_elbow_angle = 0
    right_elbow_angle = 0

    left_knee_angle = 0
    right_knee_angle = 0

    left_hip_angle = 0
    right_hip_angle = 0

    output_folder = "uploads/processed"
    os.makedirs(output_folder, exist_ok=True)

    video_name = os.path.splitext(
        os.path.basename(video_path)
    )[0]

    # Temporary OpenCV output
    temp_video = os.path.join(
        output_folder,
        f"temp_{video_name}.mp4"
    )

    # Final browser compatible output
    output_video = os.path.join(
        output_folder,
        f"processed_{video_name}.mp4"
    )

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    fps = cap.get(cv2.CAP_PROP_FPS)

    if fps <= 0:
        fps = 30

    writer = None

    if generate_video:

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")

        writer = cv2.VideoWriter(
            temp_video,
            fourcc,
            fps,
            (width, height)
        )

        if not writer.isOpened():
            raise Exception("Unable to create processed video.")

    pose = mp_pose.Pose(

        static_image_mode=False,

        model_complexity=2,

        smooth_landmarks=True,

        min_detection_confidence=0.5,

        min_tracking_confidence=0.5

    )

    # =====================================================
    # FRAME LOOP
    # =====================================================

    while True:

        success, frame = cap.read()

        if not success:
            break

        total_frames += 1

        rgb = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2RGB
        )

        results = pose.process(rgb)

        if not results.pose_landmarks:

            if writer is not None:
                writer.write(frame)

            continue

        pose_frames += 1

        landmarks = results.pose_landmarks.landmark
                # =====================================================
        # LEFT BODY LANDMARKS
        # =====================================================

        LEFT_SHOULDER = (
            landmarks[
                mp_pose.PoseLandmark.LEFT_SHOULDER
            ].x,
            landmarks[
                mp_pose.PoseLandmark.LEFT_SHOULDER
            ].y
        )

        LEFT_ELBOW = (
            landmarks[
                mp_pose.PoseLandmark.LEFT_ELBOW
            ].x,
            landmarks[
                mp_pose.PoseLandmark.LEFT_ELBOW
            ].y
        )

        LEFT_WRIST = (
            landmarks[
                mp_pose.PoseLandmark.LEFT_WRIST
            ].x,
            landmarks[
                mp_pose.PoseLandmark.LEFT_WRIST
            ].y
        )

        LEFT_HIP = (
            landmarks[
                mp_pose.PoseLandmark.LEFT_HIP
            ].x,
            landmarks[
                mp_pose.PoseLandmark.LEFT_HIP
            ].y
        )

        LEFT_KNEE = (
            landmarks[
                mp_pose.PoseLandmark.LEFT_KNEE
            ].x,
            landmarks[
                mp_pose.PoseLandmark.LEFT_KNEE
            ].y
        )

        LEFT_ANKLE = (
            landmarks[
                mp_pose.PoseLandmark.LEFT_ANKLE
            ].x,
            landmarks[
                mp_pose.PoseLandmark.LEFT_ANKLE
            ].y
        )

        # =====================================================
        # RIGHT BODY LANDMARKS
        # =====================================================

        RIGHT_SHOULDER = (
            landmarks[
                mp_pose.PoseLandmark.RIGHT_SHOULDER
            ].x,
            landmarks[
                mp_pose.PoseLandmark.RIGHT_SHOULDER
            ].y
        )

        RIGHT_ELBOW = (
            landmarks[
                mp_pose.PoseLandmark.RIGHT_ELBOW
            ].x,
            landmarks[
                mp_pose.PoseLandmark.RIGHT_ELBOW
            ].y
        )

        RIGHT_WRIST = (
            landmarks[
                mp_pose.PoseLandmark.RIGHT_WRIST
            ].x,
            landmarks[
                mp_pose.PoseLandmark.RIGHT_WRIST
            ].y
        )

        RIGHT_HIP = (
            landmarks[
                mp_pose.PoseLandmark.RIGHT_HIP
            ].x,
            landmarks[
                mp_pose.PoseLandmark.RIGHT_HIP
            ].y
        )

        RIGHT_KNEE = (
            landmarks[
                mp_pose.PoseLandmark.RIGHT_KNEE
            ].x,
            landmarks[
                mp_pose.PoseLandmark.RIGHT_KNEE
            ].y
        )

        RIGHT_ANKLE = (
            landmarks[
                mp_pose.PoseLandmark.RIGHT_ANKLE
            ].x,
            landmarks[
                mp_pose.PoseLandmark.RIGHT_ANKLE
            ].y
        )

        # =====================================================
        # JOINT ANGLE CALCULATIONS
        # =====================================================

        left_elbow_angle = calculate_angle(
            LEFT_SHOULDER,
            LEFT_ELBOW,
            LEFT_WRIST
        )

        right_elbow_angle = calculate_angle(
            RIGHT_SHOULDER,
            RIGHT_ELBOW,
            RIGHT_WRIST
        )

        left_knee_angle = calculate_angle(
            LEFT_HIP,
            LEFT_KNEE,
            LEFT_ANKLE
        )

        right_knee_angle = calculate_angle(
            RIGHT_HIP,
            RIGHT_KNEE,
            RIGHT_ANKLE
        )

        left_hip_angle = calculate_angle(
            LEFT_SHOULDER,
            LEFT_HIP,
            LEFT_KNEE
        )

        right_hip_angle = calculate_angle(
            RIGHT_SHOULDER,
            RIGHT_HIP,
            RIGHT_KNEE
        )
                # =====================================================
        # DRAW POSE LANDMARKS
        # =====================================================

        mp_draw.draw_landmarks(
            frame,
            results.pose_landmarks,
            mp_pose.POSE_CONNECTIONS,
            landmark_drawing_spec=mp_draw.DrawingSpec(
                color=(0, 255, 0),
                thickness=3,
                circle_radius=3
            ),
            connection_drawing_spec=mp_draw.DrawingSpec(
                color=(255, 0, 0),
                thickness=2
            )
        )

        # =====================================================
        # DISPLAY JOINT ANGLES
        # =====================================================

        cv2.putText(
            frame,
            f"L Knee : {left_knee_angle:.1f}",
            (30, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2
        )

        cv2.putText(
            frame,
            f"R Knee : {right_knee_angle:.1f}",
            (30, 70),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2
        )

        cv2.putText(
            frame,
            f"L Hip : {left_hip_angle:.1f}",
            (30, 100),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 0),
            2
        )

        cv2.putText(
            frame,
            f"R Hip : {right_hip_angle:.1f}",
            (30, 130),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 0),
            2
        )

        cv2.putText(
            frame,
            f"L Elbow : {left_elbow_angle:.1f}",
            (30, 160),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 255),
            2
        )

        cv2.putText(
            frame,
            f"R Elbow : {right_elbow_angle:.1f}",
            (30, 190),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 255),
            2
        )

        # =====================================================
        # WRITE FRAME
        # =====================================================

        if writer is not None:
            writer.write(frame)

    # =====================================================
    # RELEASE RESOURCES
    # =====================================================

    pose.close()

    cap.release()
    cap = None

    if writer is not None:
        writer.release()
        writer = None

    cv2.destroyAllWindows()

    gc.collect()

    # Give Windows enough time to release the file lock
    time.sleep(2)
        # =====================================================
    # CONVERT VIDEO TO BROWSER COMPATIBLE MP4
    # =====================================================

    if generate_video:

        # Ensure Windows has released the file
        time.sleep(2)

        if not os.path.exists(temp_video):
            raise Exception(
                f"Temporary video not found:\n{temp_video}"
            )

        command = [

            "ffmpeg",

            "-y",

            "-i",
            temp_video,

            "-c:v",
            "libx264",

            "-preset",
            "fast",

            "-crf",
            "23",

            "-pix_fmt",
            "yuv420p",

            "-movflags",
            "+faststart",

            "-an",

            output_video

        ]

        try:

            result = subprocess.run(

                command,

                capture_output=True,

                text=True

            )

            print("\n==============================")
            print("FFMPEG OUTPUT")
            print("==============================")

            print(result.stdout)
            print(result.stderr)

            if result.returncode != 0:

                raise Exception(result.stderr)

            print("✅ FFmpeg conversion successful.")

            if os.path.exists(temp_video):
                os.remove(temp_video)

        except Exception as e:

            print("\n==============================")
            print("FFmpeg Conversion Failed")
            print("==============================")
            print(e)

            # fallback
            if not os.path.exists(output_video):

                print("Using OpenCV generated video instead...")

                shutil.copy2(
                    temp_video,
                    output_video
                )

            try:

                if os.path.exists(temp_video):
                    os.remove(temp_video)

            except Exception:
                pass

        # Verify final output

        if not os.path.exists(output_video):

            raise Exception(
                "Processed video was not created."
            )

        if os.path.getsize(output_video) == 0:

            raise Exception(
                "Processed video is empty."
            )

        print("Saved Processed Video:")
        print(output_video)
        print(
            "Size:",
            os.path.getsize(output_video),
            "bytes"
        )
            # =====================================================
    # SUCCESS RATE
    # =====================================================

    success_rate = 0

    if total_frames > 0:

        success_rate = round(
            (pose_frames / total_frames) * 100,
            2
        )

    # =====================================================
    # RISK ANALYSIS
    # =====================================================

    if pose_frames > 0:

        risk = calculate_risk(
            left_elbow_angle,
            right_elbow_angle,
            left_knee_angle,
            right_knee_angle,
            left_hip_angle,
            right_hip_angle
        )

        rom = calculate_rom(
            left_knee_angle,
            right_knee_angle
        )

        knee_symmetry = calculate_symmetry(
            left_knee_angle,
            right_knee_angle
        )

        hip_info = hip_stability(
            left_hip_angle,
            right_hip_angle
        )

        balance = balance_score(
            left_knee_angle,
            right_knee_angle
        )

        alignment = joint_alignment(
            left_knee_angle,
            right_knee_angle
        )

        quality = calculate_movement_quality(
            balance,
            knee_symmetry["symmetry_score"],
            risk["risk_score"]
        )

        biomechanics = {

            "range_of_motion": rom,

            "movement_symmetry": knee_symmetry,

            "hip_stability": hip_info,

            "balance_score": balance,

            "joint_alignment": alignment,

            "movement_quality": quality

        }

    else:

        risk = {

            "risk_score": 0,

            "risk_level": "Unknown",

            "remarks": [
                "No human pose detected."
            ]

        }

        biomechanics = {

            "range_of_motion": {

                "average_rom": 0,

                "status": "Unknown"

            },

            "movement_symmetry": {

                "difference": 0,

                "symmetry_score": 0

            },

            "hip_stability": {

                "difference": 0,

                "status": "Unknown"

            },

            "balance_score": 0,

            "joint_alignment": "Unknown",

            "movement_quality": 0

        }

    # =====================================================
    # RETURN RESPONSE
    # =====================================================

    return {

        "frames": total_frames,

        "pose_detected": pose_frames,

        "success_rate": success_rate,

        "processed_video": output_video.replace("\\", "/"),

        "joint_angles": {

            "left_elbow": left_elbow_angle,

            "right_elbow": right_elbow_angle,

            "left_knee": left_knee_angle,

            "right_knee": right_knee_angle,

            "left_hip": left_hip_angle,

            "right_hip": right_hip_angle

        },

        "risk_analysis": risk,

        "biomechanics": biomechanics

    }