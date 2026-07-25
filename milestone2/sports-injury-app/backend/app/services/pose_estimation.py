"""
services/pose_estimation.py
-----------------------------
Wraps MediaPipe Pose to process an uploaded video: for every frame, detect
the 33 body keypoints, draw a skeleton overlay, and hand back structured
landmark data for the biomechanics service to turn into joint angles.

Pinned to mediapipe==0.10.13 deliberately: this is the last line of releases
that ships the classic `mp.solutions.pose` API bundled with its own model
weights (nothing else to download). Newer mediapipe versions moved to the
"Tasks" API, which requires separately downloading a .task model file from
Google's servers at runtime -- more moving parts than a beginner project
needs. If you outgrow this (e.g. you want GPU acceleration or the newer,
more accurate heavy model), migrating to the Tasks API later is a contained
change, isolated entirely to this file.

Codec note (found the hard way -- worth understanding, not just trusting):
OpenCV's VideoWriter, as installed via pip, cannot encode H.264 -- the
encoder is patent-licensed and pip-distributed OpenCV builds don't bundle
it. Writing directly with an H.264 fourcc silently fails to open the
writer. The 'mp4v' codec (MPEG-4 Part 2) always works and is what this
file writes to -- but web browsers do NOT support playing that codec in a
<video> tag (only H.264, VP9, or AV1). So every annotated video is written
with OpenCV first, then transcoded to real H.264 with ffmpeg as a second
step. `imageio-ffmpeg` is used instead of requiring a system-wide ffmpeg
install (a real setup burden, especially on Windows) -- it's a pip package
that bundles its own static ffmpeg binary, so `pip install -r
requirements.txt` is still the only setup step needed.
"""

import os
import subprocess
import cv2
import mediapipe as mp
import imageio_ffmpeg

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
mp_styles = mp.solutions.drawing_styles

# The 33 MediaPipe Pose landmarks, in index order. Useful for turning a raw
# landmark list back into named points (see biomechanics.py).
LANDMARK_NAMES = [lm.name.lower() for lm in mp_pose.PoseLandmark]


def _landmark_to_dict(landmark) -> dict:
    return {
        "x": round(landmark.x, 5),
        "y": round(landmark.y, 5),
        "z": round(landmark.z, 5),
        "visibility": round(landmark.visibility, 4),
    }


def _transcode_to_browser_compatible_h264(source_path: str, destination_path: str) -> None:
    """
    Re-encodes source_path (whatever codec OpenCV wrote) into real H.264 at
    destination_path, using the ffmpeg binary bundled by imageio-ffmpeg.
    Raises RuntimeError with ffmpeg's own error output if it fails, rather
    than silently leaving a broken video in place.
    """
    ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
    result = subprocess.run(
        [
            ffmpeg_path, "-y",
            "-i", source_path,
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",   # widest playback compatibility across browsers/devices
            "-movflags", "+faststart",  # lets the video start playing before it's fully downloaded
            destination_path,
        ],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg transcode failed: {result.stderr[-1000:]}")


def process_video(input_path: str, annotated_output_path: str, model_complexity: int = 1):
    """
    Reads the video at input_path frame by frame, runs pose detection on each
    frame, writes an annotated (skeleton-overlay) copy to annotated_output_path
    (transcoded to browser-playable H.264 -- see module docstring), and yields
    one dict per frame:

        {
            "frame_number": int,
            "timestamp_seconds": float,
            "pose_detected": bool,
            "landmarks": list[dict] | None,   # 33 points, each {x,y,z,visibility}
        }

    This is a generator so the caller (the background task in routers/videos.py)
    can persist each frame's result to the database as it goes, rather than
    holding an entire video's worth of frames in memory at once.
    """
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video file: {input_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    os.makedirs(os.path.dirname(annotated_output_path), exist_ok=True)
    # OpenCV writes to this intermediate file first (mp4v -- always works,
    # but not browser-playable); it gets transcoded to the real output path
    # and deleted once every frame has been written.
    raw_path = annotated_output_path + ".raw.mp4"
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(raw_path, fourcc, fps, (width, height))

    frame_number = 0
    with mp_pose.Pose(
        static_image_mode=False,
        model_complexity=model_complexity,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as pose:
        while True:
            success, frame = cap.read()
            if not success:
                break

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            rgb_frame.flags.writeable = False
            results = pose.process(rgb_frame)

            annotated_frame = frame.copy()
            pose_detected = results.pose_landmarks is not None
            landmarks_out = None

            if pose_detected:
                landmarks_out = [_landmark_to_dict(lm) for lm in results.pose_landmarks.landmark]
                mp_drawing.draw_landmarks(
                    annotated_frame,
                    results.pose_landmarks,
                    mp_pose.POSE_CONNECTIONS,
                    landmark_drawing_spec=mp_styles.get_default_pose_landmarks_style(),
                )

            writer.write(annotated_frame)

            yield {
                "frame_number": frame_number,
                "timestamp_seconds": round(frame_number / fps, 4),
                "pose_detected": pose_detected,
                "landmarks": landmarks_out,
            }
            frame_number += 1

    cap.release()
    writer.release()

    try:
        _transcode_to_browser_compatible_h264(raw_path, annotated_output_path)
    finally:
        if os.path.exists(raw_path):
            os.remove(raw_path)


def get_video_metadata(input_path: str) -> dict:
    """Quick metadata read (fps, frame count, duration) without full processing."""
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video file: {input_path}")
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    cap.release()
    return {
        "fps": fps,
        "frame_count": frame_count,
        "duration_seconds": round(frame_count / fps, 2) if fps else None,
    }
