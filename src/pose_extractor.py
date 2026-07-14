"""
pose_extractor.py

Step 1 of the Sports Injury Risk Detection pipeline.

What this script does:
1. Opens a video file frame by frame (using OpenCV)
2. Sends each frame to MediaPipe Pose
3. Collects the 33 body landmarks (x, y, z, visibility) for every frame
4. Saves everything to a single CSV file
5. (Optional) Also saves a copy of the video with the skeleton drawn on top,
   so you can visually confirm it worked.

Usage (from the project root folder):
    python src/pose_extractor.py --video data/raw_videos/squat_test.mp4
    python src/pose_extractor.py --webcam
    python src/pose_extractor.py            (no flags -> asks you interactively)
"""

import os
import argparse
import cv2
import pandas as pd
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

from config import LANDMARK_NAMES, CSV_OUTPUT_DIR, ANNOTATED_VIDEO_DIR


def choose_input_source_interactively():
    """
    Asks the user in the terminal whether they want to use a video file
    (already sitting in data/raw_videos/) or the webcam.

    If the user picks "video file", this function lists every video already
    present in data/raw_videos/ and lets them pick one by number -- no typing
    filenames required.

    Returns a tuple: (source, is_webcam)
      - source: either a file path (string) or a camera index (int)
      - is_webcam: True/False, used later to know when to stop reading frames
    """
    print("\nWhere is the video coming from?")
    print("  1. A video already in data/raw_videos/")
    print("  2. Webcam (live camera)")
    choice = input("Enter 1 or 2: ").strip()

    if choice == "2":
        return 0, True  # 0 = default webcam index

    # --- Choice 1: list existing videos in the folder ---
    video_extensions = (".mp4", ".mov", ".avi", ".mkv")
    folder = "data/raw_videos"

    if not os.path.isdir(folder):
        raise FileNotFoundError(f"Folder not found: {folder}. Create it and add a video first.")

    available_videos = [f for f in os.listdir(folder) if f.lower().endswith(video_extensions)]

    if not available_videos:
        raise FileNotFoundError(
            f"No video files found in {folder}. Add a video there first, then run again."
        )

    print(f"\nVideos found in {folder}:")
    for i, filename in enumerate(available_videos, start=1):
        print(f"  {i}. {filename}")

    selected = input(f"Enter the number of the video to use (1-{len(available_videos)}): ").strip()

    try:
        selected_index = int(selected) - 1
        chosen_filename = available_videos[selected_index]
    except (ValueError, IndexError):
        raise ValueError("Invalid selection. Please run the script again and enter a valid number.")

    video_path = os.path.join(folder, chosen_filename)
    return video_path, False


def extract_landmarks_from_video(source, is_webcam: bool = False, save_annotated_video: bool = True):
    """
    Reads a video (from a file OR a webcam), runs MediaPipe Pose on every frame,
    and returns a list of dictionaries (one dict per frame) containing all landmark data.

    `source` is either:
        - a string file path (e.g. "data/raw_videos/test1.mp4"), or
        - an integer camera index (e.g. 0 for default webcam)
    """

    # --- Set up MediaPipe Pose ---
    base_options = python.BaseOptions(model_asset_path='models/pose_landmarker_full.task')
    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.VIDEO,
        num_poses=1,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5)
    
    pose = vision.PoseLandmarker.create_from_options(options)

    # --- Open the video with OpenCV ---
    # source can be a file path (string) or a webcam index (int) -- cv2.VideoCapture accepts both
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        raise FileNotFoundError(f"Could not open video source: {source}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0 or is_webcam:
        fps = 30  # webcams often don't report fps reliably, so we assume 30

    # --- Prepare the annotated video writer (optional visual output) ---
    video_writer = None
    if save_annotated_video:
        os.makedirs(ANNOTATED_VIDEO_DIR, exist_ok=True)
        # Webcam has no filename, so we label it with "webcam" instead
        video_name = "webcam_session" if is_webcam else os.path.splitext(os.path.basename(source))[0]
        out_path = os.path.join(ANNOTATED_VIDEO_DIR, f"{video_name}_annotated.mp4")

        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        video_writer = cv2.VideoWriter(out_path, fourcc, fps, (width, height))

    all_frames_data = []  # this list holds one dict per frame -> becomes the CSV rows
    frame_number = 0

    if is_webcam:
        print("Webcam started. Press 'q' in the video window to stop recording.")
    else:
        print(f"Processing video: {source}")

    while True:
        success, frame = cap.read()
        if not success:
            # No more frames left -> video file has ended (won't normally happen with webcam)
            break

        # MediaPipe expects RGB images, OpenCV reads frames as BGR by default
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Run pose detection on this single frame
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
        timestamp_ms = int(frame_number * 1000 / fps)
        results = pose.detect_for_video(mp_image, timestamp_ms if timestamp_ms > 0 else 1)

        # Build one row of data for this frame
        row = {
            "frame_number": frame_number,
            "timestamp_sec": round(frame_number / fps, 3),
        }

        if results.pose_landmarks and len(results.pose_landmarks) > 0:
            landmarks = results.pose_landmarks[0]
            for idx, landmark in enumerate(landmarks):
                if idx >= len(LANDMARK_NAMES):
                    break
                name = LANDMARK_NAMES[idx]
                row[f"{name}_x"] = landmark.x
                row[f"{name}_y"] = landmark.y
                row[f"{name}_z"] = landmark.z
                row[f"{name}_visibility"] = getattr(landmark, 'visibility', 0.0)

            # Draw the skeleton on the frame (for the live preview and optional video output)
            h, w, _ = frame.shape
            POSE_CONNECTIONS = [
                (0, 1), (1, 2), (2, 3), (3, 7), (0, 4), (4, 5), (5, 6), (6, 8), (9, 10),
                (11, 12), (11, 13), (13, 15), (15, 17), (15, 19), (15, 21), (17, 19),
                (12, 14), (14, 16), (16, 18), (16, 20), (16, 22), (18, 20), (11, 23),
                (12, 24), (23, 24), (23, 25), (24, 26), (25, 27), (26, 28), (27, 29),
                (28, 30), (29, 31), (30, 32), (27, 31), (28, 32)
            ]
            
            # Draw lines
            for connection in POSE_CONNECTIONS:
                start_idx, end_idx = connection
                if start_idx < len(landmarks) and end_idx < len(landmarks):
                    start = landmarks[start_idx]
                    end = landmarks[end_idx]
                    if getattr(start, 'visibility', 0.0) > 0.5 and getattr(end, 'visibility', 0.0) > 0.5:
                        pt1 = (int(start.x * w), int(start.y * h))
                        pt2 = (int(end.x * w), int(end.y * h))
                        cv2.line(frame, pt1, pt2, (0, 255, 0), 2)
            
            # Draw points
            for lm in landmarks:
                if getattr(lm, 'visibility', 0.0) > 0.5:
                    pt = (int(lm.x * w), int(lm.y * h))
                    cv2.circle(frame, pt, 4, (0, 0, 255), -1)
        else:
            # No person detected in this frame -> fill landmark columns with None
            # (kept as a row so frame_number/timestamp stay aligned with the video)
            for name in LANDMARK_NAMES:
                row[f"{name}_x"] = None
                row[f"{name}_y"] = None
                row[f"{name}_z"] = None
                row[f"{name}_visibility"] = None

        all_frames_data.append(row)

        if save_annotated_video:
            video_writer.write(frame)

        # Show a live preview window (useful for webcam, harmless for files too)
        cv2.imshow("Pose Extraction - press 'q' to stop", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            print("Stopped by user (pressed 'q').")
            break

        frame_number += 1

    # --- Clean up ---
    cap.release()
    if video_writer is not None:
        video_writer.release()
    cv2.destroyAllWindows()
    pose.close()

    print(f"Finished processing. Total frames: {frame_number}")
    return all_frames_data


def save_to_csv(frames_data, source, is_webcam: bool = False):
    """Converts the collected list of frame dicts into a CSV file."""
    os.makedirs(CSV_OUTPUT_DIR, exist_ok=True)

    video_name = "webcam_session" if is_webcam else os.path.splitext(os.path.basename(source))[0]
    csv_path = os.path.join(CSV_OUTPUT_DIR, f"{video_name}_landmarks.csv")

    df = pd.DataFrame(frames_data)
    df.to_csv(csv_path, index=False)

    print(f"Saved landmarks CSV to: {csv_path}")
    return csv_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract pose landmarks from a video or webcam.")
    parser.add_argument("--video", help="Path to the input video file")
    parser.add_argument("--webcam", action="store_true", help="Use the live webcam instead of a file")
    parser.add_argument(
        "--no-annotated-video",
        action="store_true",
        help="Skip saving the skeleton-overlay video (faster, CSV only)",
    )
    args = parser.parse_args()

    # Decide the input source based on how the script was run
    if args.webcam:
        source, is_webcam = 0, True
    elif args.video:
        source, is_webcam = args.video, False
    else:
        # No flags given at all -> ask the user interactively
        source, is_webcam = choose_input_source_interactively()

    frames_data = extract_landmarks_from_video(
        source, is_webcam=is_webcam, save_annotated_video=not args.no_annotated_video
    )
    save_to_csv(frames_data, source, is_webcam=is_webcam)