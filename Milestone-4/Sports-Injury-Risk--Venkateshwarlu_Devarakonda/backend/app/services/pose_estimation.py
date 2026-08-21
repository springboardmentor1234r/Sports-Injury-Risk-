import os
import gc
import cv2
import math
import shutil
import subprocess
from typing import Dict, List, Optional, Tuple

import mediapipe as mp

from app.services.angle_calculator import calculate_angle

from app.services.biomechanical_analysis import (
    calculate_rom,
    calculate_symmetry,
    hip_stability,
    balance_score,
    joint_alignment,
)

from app.services.anomaly_detection import (
    detect_movement_anomalies,
)

from app.services.injury_prediction import (
    predict_injury_risks,
)

from app.services.risk_engine import (
    calculate_risk,
)

from app.services.recommendation_engine import (
    generate_recommendations,
)


# ============================================================
# MEDIAPIPE
# ============================================================

mp_pose = mp.solutions.pose
mp_draw = mp.solutions.drawing_utils

POSE_LANDMARK = mp_pose.PoseLandmark


# ============================================================
# CONFIGURATION
# ============================================================

# MediaPipe model complexity:
# 0 = fastest
# 1 = balanced
# 2 = most accurate but slower
POSE_MODEL_COMPLEXITY = 1

MIN_DETECTION_CONFIDENCE = 0.5
MIN_TRACKING_CONFIDENCE = 0.5
MIN_LANDMARK_VISIBILITY = 0.5

# Draw MediaPipe skeleton.
DRAW_LANDMARKS = True

# Draw calculated joint angles.
DRAW_ANGLE_TEXT = True

# Process every frame.
#
# 1 = every frame
# 2 = every second frame
# 3 = every third frame
#
# For final project accuracy, keep this at 1.
FRAME_SKIP = 1

# FFmpeg configuration.
FFMPEG_PRESET = "veryfast"
FFMPEG_CRF = "23"


# ============================================================
# BASIC HELPERS
# ============================================================

def _landmark_point(
    landmark,
    min_visibility: float = MIN_LANDMARK_VISIBILITY,
) -> Optional[Tuple[float, float]]:
    """
    Convert a MediaPipe landmark into an (x, y) tuple.

    Returns None if:
    - landmark is missing
    - visibility is too low
    - coordinates are invalid
    """

    if landmark is None:
        return None

    try:
        visibility = float(
            getattr(
                landmark,
                "visibility",
                0.0,
            )
        )
    except (TypeError, ValueError):
        return None

    if visibility < min_visibility:
        return None

    try:
        x = float(landmark.x)
        y = float(landmark.y)
    except (TypeError, ValueError):
        return None

    if not (
        math.isfinite(x)
        and math.isfinite(y)
    ):
        return None

    return x, y


def _calculate_joint_angle(
    point_a: Optional[Tuple[float, float]],
    point_b: Optional[Tuple[float, float]],
    point_c: Optional[Tuple[float, float]],
) -> Optional[float]:
    """
    Safely calculate one joint angle.

    Angle is measured at point_b.
    """

    if (
        point_a is None
        or point_b is None
        or point_c is None
    ):
        return None

    try:
        angle = float(
            calculate_angle(
                point_a,
                point_b,
                point_c,
            )
        )
    except (
        TypeError,
        ValueError,
        ZeroDivisionError,
    ):
        return None

    if not math.isfinite(angle):
        return None

    # Protect against unexpected values.
    angle = max(
        0.0,
        min(
            180.0,
            angle,
        ),
    )

    return round(angle, 2)


def _append_if_valid(
    values: List[float],
    value: Optional[float],
) -> None:
    """
    Append a valid numeric value to a list.
    """

    if value is None:
        return

    try:
        number = float(value)
    except (TypeError, ValueError):
        return

    if not math.isfinite(number):
        return

    values.append(number)


def _average(
    values: List[float],
) -> Optional[float]:
    """
    Calculate average of a list.
    """

    if not values:
        return None

    return round(
        sum(values) / len(values),
        2,
    )


def _minimum(
    values: List[float],
) -> Optional[float]:
    """
    Calculate minimum of a list.
    """

    if not values:
        return None

    return round(
        min(values),
        2,
    )


def _maximum(
    values: List[float],
) -> Optional[float]:
    """
    Calculate maximum of a list.
    """

    if not values:
        return None

    return round(
        max(values),
        2,
    )


def _build_joint_result(
    values: List[float],
) -> Dict:
    """
    Build standardized joint-angle result.
    """

    return {
        "average": _average(values),
        "minimum": _minimum(values),
        "maximum": _maximum(values),
        "samples": len(values),
        "analysis_available": bool(values),
    }


# ============================================================
# DISPLAY HELPERS
# ============================================================

def _display_angle(
    frame,
    label: str,
    value: Optional[float],
    position: Tuple[int, int],
    color: Tuple[int, int, int],
) -> None:
    """
    Display one joint angle on the video frame.
    """

    if value is None:
        text = f"{label}: N/A"
    else:
        text = f"{label}: {value:.1f}"

    cv2.putText(
        frame,
        text,
        position,
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        color,
        2,
        cv2.LINE_AA,
    )


def _draw_angles(
    frame,
    left_knee: Optional[float],
    right_knee: Optional[float],
    left_hip: Optional[float],
    right_hip: Optional[float],
    left_elbow: Optional[float],
    right_elbow: Optional[float],
) -> None:
    """
    Draw calculated joint angles.
    """

    _display_angle(
        frame,
        "L Knee",
        left_knee,
        (20, 35),
        (0, 255, 0),
    )

    _display_angle(
        frame,
        "R Knee",
        right_knee,
        (20, 65),
        (0, 255, 0),
    )

    _display_angle(
        frame,
        "L Hip",
        left_hip,
        (20, 95),
        (255, 255, 0),
    )

    _display_angle(
        frame,
        "R Hip",
        right_hip,
        (20, 125),
        (255, 255, 0),
    )

    _display_angle(
        frame,
        "L Elbow",
        left_elbow,
        (20, 155),
        (0, 255, 255),
    )

    _display_angle(
        frame,
        "R Elbow",
        right_elbow,
        (20, 185),
        (0, 255, 255),
    )


# ============================================================
# LANDMARK EXTRACTION
# ============================================================

def _get_landmark(
    landmarks,
    landmark_name,
) -> Optional[Tuple[float, float]]:
    """
    Safely get a single MediaPipe landmark.
    """

    try:
        landmark = landmarks[landmark_name]
    except (
        IndexError,
        KeyError,
        TypeError,
    ):
        return None

    return _landmark_point(
        landmark
    )


def _extract_landmarks(
    landmarks,
) -> Dict[str, Optional[Tuple[float, float]]]:
    """
    Extract the landmarks required by this project.
    """

    return {
        "left_shoulder": _get_landmark(
            landmarks,
            POSE_LANDMARK.LEFT_SHOULDER,
        ),
        "left_elbow": _get_landmark(
            landmarks,
            POSE_LANDMARK.LEFT_ELBOW,
        ),
        "left_wrist": _get_landmark(
            landmarks,
            POSE_LANDMARK.LEFT_WRIST,
        ),
        "left_hip": _get_landmark(
            landmarks,
            POSE_LANDMARK.LEFT_HIP,
        ),
        "left_knee": _get_landmark(
            landmarks,
            POSE_LANDMARK.LEFT_KNEE,
        ),
        "left_ankle": _get_landmark(
            landmarks,
            POSE_LANDMARK.LEFT_ANKLE,
        ),
        "right_shoulder": _get_landmark(
            landmarks,
            POSE_LANDMARK.RIGHT_SHOULDER,
        ),
        "right_elbow": _get_landmark(
            landmarks,
            POSE_LANDMARK.RIGHT_ELBOW,
        ),
        "right_wrist": _get_landmark(
            landmarks,
            POSE_LANDMARK.RIGHT_WRIST,
        ),
        "right_hip": _get_landmark(
            landmarks,
            POSE_LANDMARK.RIGHT_HIP,
        ),
        "right_knee": _get_landmark(
            landmarks,
            POSE_LANDMARK.RIGHT_KNEE,
        ),
        "right_ankle": _get_landmark(
            landmarks,
            POSE_LANDMARK.RIGHT_ANKLE,
        ),
    }


# ============================================================
# ANGLE EXTRACTION
# ============================================================

def _calculate_frame_angles(
    points: Dict[
        str,
        Optional[Tuple[float, float]],
    ],
) -> Dict[str, Optional[float]]:
    """
    Calculate all required joint angles for one frame.
    """

    return {
        # ----------------------------------------------------
        # ELBOWS
        # ----------------------------------------------------

        "left_elbow": _calculate_joint_angle(
            points["left_shoulder"],
            points["left_elbow"],
            points["left_wrist"],
        ),

        "right_elbow": _calculate_joint_angle(
            points["right_shoulder"],
            points["right_elbow"],
            points["right_wrist"],
        ),

        # ----------------------------------------------------
        # KNEES
        # ----------------------------------------------------

        "left_knee": _calculate_joint_angle(
            points["left_hip"],
            points["left_knee"],
            points["left_ankle"],
        ),

        "right_knee": _calculate_joint_angle(
            points["right_hip"],
            points["right_knee"],
            points["right_ankle"],
        ),

        # ----------------------------------------------------
        # HIPS
        # ----------------------------------------------------

        "left_hip": _calculate_joint_angle(
            points["left_shoulder"],
            points["left_hip"],
            points["left_knee"],
        ),

        "right_hip": _calculate_joint_angle(
            points["right_shoulder"],
            points["right_hip"],
            points["right_knee"],
        ),
    }


def _store_frame_angles(
    angles: Dict[str, Optional[float]],
    angle_data: Dict[str, List[float]],
) -> None:
    """
    Store valid frame-level joint angles.
    """

    for joint_name in angle_data:
        _append_if_valid(
            angle_data[joint_name],
            angles.get(joint_name),
        )


# ============================================================
# VIDEO OUTPUT
# ============================================================

def _create_output_paths(
    video_path: str,
) -> Tuple[str, str, str]:
    """
    Create processed-video paths.
    """

    output_folder = os.path.join(
        "uploads",
        "processed",
    )

    os.makedirs(
        output_folder,
        exist_ok=True,
    )

    video_name = os.path.splitext(
        os.path.basename(video_path)
    )[0]

    temp_video = os.path.join(
        output_folder,
        f"temp_{video_name}.mp4",
    )

    output_video = os.path.join(
        output_folder,
        f"processed_{video_name}.mp4",
    )

    return (
        output_folder,
        temp_video,
        output_video,
    )


def _create_video_writer(
    path: str,
    fps: float,
    width: int,
    height: int,
):
    """
    Create OpenCV video writer.
    """

    fourcc = cv2.VideoWriter_fourcc(
        *"mp4v"
    )

    writer = cv2.VideoWriter(
        path,
        fourcc,
        fps,
        (width, height),
    )

    if not writer.isOpened():
        writer.release()

        raise RuntimeError(
            f"Unable to create processed video: {path}"
        )

    return writer


def _convert_video_with_ffmpeg(
    temp_video: str,
    output_video: str,
) -> str:
    """
    Convert temporary OpenCV video to
    browser-compatible H.264 MP4.
    """

    if not os.path.exists(temp_video):
        raise FileNotFoundError(
            f"Temporary video not found: {temp_video}"
        )

    command = [
        "ffmpeg",
        "-y",
        "-i",
        temp_video,
        "-c:v",
        "libx264",
        "-preset",
        FFMPEG_PRESET,
        "-crf",
        FFMPEG_CRF,
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        "-an",
        output_video,
    ]

    try:
        result = subprocess.run(
            command,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            text=True,
            check=False,
        )

    except FileNotFoundError as error:
        raise RuntimeError(
            "FFmpeg is not installed or is not available in PATH."
        ) from error

    if result.returncode != 0:
        raise RuntimeError(
            f"FFmpeg conversion failed:\n{result.stderr}"
        )

    if not os.path.exists(output_video):
        raise RuntimeError(
            "FFmpeg completed but output video was not created."
        )

    if os.path.getsize(output_video) <= 0:
        raise RuntimeError(
            "FFmpeg created an empty output video."
        )

    return output_video


# ============================================================
# EMPTY / FAILURE RESULT
# ============================================================

def _insufficient_result(
    total_frames: int,
    pose_frames: int,
    success_rate: Optional[float],
    processed_video_url: Optional[str],
    joint_angles: Dict,
    fps: Optional[float] = None,
    duration_seconds: Optional[float] = None,
) -> Dict:
    """
    Return a consistent result when pose data is insufficient.
    """

    return {
        "frames": total_frames,
        "pose_detected": pose_frames,
        "success_rate": success_rate,
        "fps": fps,
        "duration_seconds": duration_seconds,
        "processed_video": processed_video_url,

        "analysis_status": (
            "Insufficient pose data."
        ),

        "joint_angles": joint_angles,

        "anomaly_detection": {
            "analysis_available": False,
            "status": (
                "No valid joint-angle measurements detected."
            ),
        },

        "injury_prediction": {
            "analysis_available": False,
            "status": (
                "Insufficient movement data."
            ),
        },

        "risk_analysis": {
            "analysis_available": False,
            "risk_score": None,
            "risk_level": "Unknown",
            "risk_factors": [],
            "recommendations": [],
            "component_scores": {},
            "joint_scores": {},
            "highest_risk": {},
            "data_completeness": 0,
            "remarks": [],
        },

        "biomechanics": {
            "analysis_available": False,
            "status": (
                "Insufficient pose data."
            ),
        },

        "recommendations": {
            "total_recommendations": 0,
            "recommendations": [],
            "analysis_status": (
                "Insufficient analysis data."
            ),
        },
    }


# ============================================================
# BIOMECHANICAL ANALYSIS
# ============================================================

def _build_biomechanics(
    angle_data: Dict[str, List[float]],
) -> Dict:
    """
    Calculate biomechanical indicators after
    video processing is complete.
    """

    left_knee = angle_data["left_knee"]
    right_knee = angle_data["right_knee"]

    left_hip = angle_data["left_hip"]
    right_hip = angle_data["right_hip"]

    biomechanics = {}

    # ========================================================
    # RANGE OF MOTION
    # ========================================================

    if left_knee and right_knee:

        try:
            biomechanics["range_of_motion"] = (
                calculate_rom(
                    _average(left_knee),
                    _average(right_knee),
                    _minimum(left_knee),
                    _minimum(right_knee),
                    _maximum(left_knee),
                    _maximum(right_knee),
                )
            )

        except Exception as error:

            biomechanics["range_of_motion"] = {
                "analysis_available": False,
                "status": (
                    "Range-of-motion calculation failed."
                ),
                "error": str(error),
            }

    else:

        biomechanics["range_of_motion"] = {
            "analysis_available": False,
            "status": (
                "Insufficient knee-angle data."
            ),
        }

    # ========================================================
    # MOVEMENT SYMMETRY
    # ========================================================

    if left_knee and right_knee:

        try:
            biomechanics["movement_symmetry"] = (
                calculate_symmetry(
                    _average(left_knee),
                    _average(right_knee),
                )
            )

        except Exception as error:

            biomechanics["movement_symmetry"] = {
                "analysis_available": False,
                "status": (
                    "Movement symmetry calculation failed."
                ),
                "error": str(error),
            }

    else:

        biomechanics["movement_symmetry"] = {
            "analysis_available": False,
            "status": (
                "Insufficient knee symmetry data."
            ),
        }

    # ========================================================
    # HIP STABILITY
    # ========================================================

    if left_hip and right_hip:

        try:
            biomechanics["hip_stability"] = (
                hip_stability(
                    _average(left_hip),
                    _average(right_hip),
                )
            )

        except Exception as error:

            biomechanics["hip_stability"] = {
                "analysis_available": False,
                "status": (
                    "Hip stability calculation failed."
                ),
                "error": str(error),
            }

    else:

        biomechanics["hip_stability"] = {
            "analysis_available": False,
            "status": (
                "Insufficient hip-angle data."
            ),
        }

    # ========================================================
    # BALANCE
    # ========================================================

    if left_knee and right_knee:

        try:
            biomechanics["balance_score"] = (
                balance_score(
                    _average(left_knee),
                    _average(right_knee),
                )
            )

        except Exception:

            biomechanics["balance_score"] = None

    else:

        biomechanics["balance_score"] = None

    # ========================================================
    # JOINT ALIGNMENT
    # ========================================================

    if left_knee and right_knee:

        try:
            biomechanics["joint_alignment"] = (
                joint_alignment(
                    _average(left_knee),
                    _average(right_knee),
                )
            )

        except Exception:

            biomechanics["joint_alignment"] = "Unknown"

    else:

        biomechanics["joint_alignment"] = "Unknown"

    # ========================================================
    # MOVEMENT QUALITY
    # ========================================================

    current_balance = biomechanics.get(
        "balance_score"
    )

    movement_symmetry = biomechanics.get(
        "movement_symmetry",
        {},
    )

    symmetry_score = None

    if isinstance(
        movement_symmetry,
        dict,
    ):
        symmetry_score = movement_symmetry.get(
            "symmetry_score"
        )

    movement_quality = None

    if (
        current_balance is not None
        and symmetry_score is not None
    ):

        try:

            movement_quality = (
                float(current_balance) * 0.5
                + float(symmetry_score) * 0.5
            )

            movement_quality = round(
                max(
                    0.0,
                    min(
                        100.0,
                        movement_quality,
                    ),
                ),
                2,
            )

        except (
            TypeError,
            ValueError,
        ):

            movement_quality = None

    biomechanics["movement_quality"] = (
        movement_quality
    )

    # ========================================================
    # DATA COMPLETENESS
    # ========================================================

    total_joint_types = len(
        angle_data
    )

    available_joint_types = sum(
        1
        for values in angle_data.values()
        if values
    )

    data_completeness = 0

    if total_joint_types > 0:

        data_completeness = round(
            (
                available_joint_types
                / total_joint_types
            ) * 100,
            2,
        )

    biomechanics["data_completeness"] = (
        data_completeness
    )

    biomechanics["analysis_available"] = (
        available_joint_types > 0
    )

    return biomechanics


# ============================================================
# MAIN POSE ANALYSIS
# ============================================================

def analyze_pose(
    video_path: str,
    generate_video: bool = True,
) -> Dict:
    """
    Analyze an athlete video using MediaPipe Pose.

    Pipeline:

        Video
          ↓
        MediaPipe Pose
          ↓
        Landmark extraction
          ↓
        Joint angle calculation
          ↓
        Biomechanical analysis
          ↓
        Movement anomaly detection
          ↓
        Injury risk prediction
          ↓
        Risk engine
          ↓
        Recommendations
          ↓
        Final JSON result

    The function is intentionally compatible with
    the existing project service modules.
    """

    # ========================================================
    # VALIDATION
    # ========================================================

    if not video_path:
        raise ValueError(
            "Video path is required."
        )

    if not isinstance(
        video_path,
        str,
    ):
        raise TypeError(
            "Video path must be a string."
        )

    if not os.path.isfile(
        video_path
    ):
        raise FileNotFoundError(
            f"Video not found: {video_path}"
        )

    # ========================================================
    # OPEN VIDEO
    # ========================================================

    cap = cv2.VideoCapture(
        video_path
    )

    if not cap.isOpened():

        raise RuntimeError(
            f"Cannot open video: {video_path}"
        )

    total_frames = 0
    pose_frames = 0
    processed_frames = 0

    # ========================================================
    # ANGLE STORAGE
    # ========================================================

    angle_data = {
        "left_elbow": [],
        "right_elbow": [],

        "left_knee": [],
        "right_knee": [],

        "left_hip": [],
        "right_hip": [],
    }

    # ========================================================
    # VIDEO INFORMATION
    # ========================================================

    width = int(
        cap.get(
            cv2.CAP_PROP_FRAME_WIDTH
        )
    )

    height = int(
        cap.get(
            cv2.CAP_PROP_FRAME_HEIGHT
        )
    )

    fps = float(
        cap.get(
            cv2.CAP_PROP_FPS
        )
    )

    if (
        not math.isfinite(fps)
        or fps <= 0
    ):
        fps = 30.0

    if width <= 0 or height <= 0:

        cap.release()

        raise RuntimeError(
            "Invalid video dimensions."
        )

    duration_seconds = None

    if fps > 0:

        duration_seconds = round(
            total_frames / fps,
            2,
        )

    # ========================================================
    # OUTPUT PATHS
    # ========================================================

    (
        _output_folder,
        temp_video,
        output_video,
    ) = _create_output_paths(
        video_path
    )

    writer = None

    # ========================================================
    # VIDEO WRITER
    # ========================================================

    if generate_video:

        writer = _create_video_writer(
            temp_video,
            fps,
            width,
            height,
        )

    # ========================================================
    # MEDIAPIPE POSE
    # ========================================================

    pose = mp_pose.Pose(
        static_image_mode=False,
        model_complexity=POSE_MODEL_COMPLEXITY,
        smooth_landmarks=True,
        enable_segmentation=False,
        min_detection_confidence=(
            MIN_DETECTION_CONFIDENCE
        ),
        min_tracking_confidence=(
            MIN_TRACKING_CONFIDENCE
        ),
    )

    # ========================================================
    # FRAME PROCESSING
    # ========================================================

    try:

        while True:

            success, frame = cap.read()

            if not success:
                break

            total_frames += 1

            # ------------------------------------------------
            # FRAME SKIPPING
            # ------------------------------------------------

            should_process = (
                FRAME_SKIP <= 1
                or (
                    (total_frames - 1)
                    % FRAME_SKIP
                    == 0
                )
            )

            if not should_process:

                if writer is not None:
                    writer.write(frame)

                continue

            processed_frames += 1

            # ------------------------------------------------
            # BGR -> RGB
            # ------------------------------------------------

            rgb = cv2.cvtColor(
                frame,
                cv2.COLOR_BGR2RGB,
            )

            # Helps reduce unnecessary memory
            # references inside MediaPipe.
            rgb.flags.writeable = False

            # ------------------------------------------------
            # MEDIAPIPE POSE
            # ------------------------------------------------

            results = pose.process(
                rgb
            )

            rgb.flags.writeable = True

            # ------------------------------------------------
            # NO POSE
            # ------------------------------------------------

            if not results.pose_landmarks:

                if writer is not None:
                    writer.write(frame)

                continue

            pose_frames += 1

            # ------------------------------------------------
            # LANDMARKS
            # ------------------------------------------------

            landmarks = (
                results.pose_landmarks.landmark
            )

            # ------------------------------------------------
            # EXTRACT LANDMARKS
            # ------------------------------------------------

            points = _extract_landmarks(
                landmarks
            )

            # ------------------------------------------------
            # CALCULATE ANGLES
            # ------------------------------------------------

            angles = _calculate_frame_angles(
                points
            )

            # ------------------------------------------------
            # STORE ANGLES
            # ------------------------------------------------

            _store_frame_angles(
                angles,
                angle_data,
            )

            # ------------------------------------------------
            # DRAW SKELETON
            # ------------------------------------------------

            if DRAW_LANDMARKS:

                mp_draw.draw_landmarks(
                    frame,
                    results.pose_landmarks,
                    mp_pose.POSE_CONNECTIONS,
                )

            # ------------------------------------------------
            # DRAW ANGLES
            # ------------------------------------------------

            if DRAW_ANGLE_TEXT:

                _draw_angles(
                    frame,
                    angles.get(
                        "left_knee"
                    ),
                    angles.get(
                        "right_knee"
                    ),
                    angles.get(
                        "left_hip"
                    ),
                    angles.get(
                        "right_hip"
                    ),
                    angles.get(
                        "left_elbow"
                    ),
                    angles.get(
                        "right_elbow"
                    ),
                )

            # ------------------------------------------------
            # WRITE FRAME
            # ------------------------------------------------

            if writer is not None:

                writer.write(
                    frame
                )

    finally:

        # ====================================================
        # MEDIAPIPE CLEANUP
        # ====================================================

        try:
            pose.close()
        except Exception:
            pass

        # ====================================================
        # VIDEO CAPTURE CLEANUP
        # ====================================================

        try:
            cap.release()
        except Exception:
            pass

        # ====================================================
        # VIDEO WRITER CLEANUP
        # ====================================================

        if writer is not None:

            try:
                writer.release()
            except Exception:
                pass

            writer = None

        # ====================================================
        # GARBAGE COLLECTION
        # ====================================================

        gc.collect()

    # ========================================================
    # FINAL VIDEO METADATA
    # ========================================================

    if fps > 0:

        duration_seconds = round(
            total_frames / fps,
            2,
        )

    # ========================================================
    # SUCCESS RATE
    # ========================================================

    success_rate = None

    if processed_frames > 0:

        success_rate = round(
            (
                pose_frames
                / processed_frames
            ) * 100,
            2,
        )

    # ========================================================
    # PROCESSED VIDEO
    # ========================================================

    processed_video_path = None

    if generate_video:

        if not os.path.exists(
            temp_video
        ):

            raise RuntimeError(
                f"Temporary video not found: {temp_video}"
            )

        try:

            processed_video_path = (
                _convert_video_with_ffmpeg(
                    temp_video,
                    output_video,
                )
            )

            print(
                "✅ FFmpeg conversion successful."
            )

            # Remove temporary file.
            try:
                os.remove(
                    temp_video
                )
            except OSError:
                pass

        except Exception as ffmpeg_error:

            print(
                "⚠️ FFmpeg conversion failed."
            )

            print(
                ffmpeg_error
            )
            print("PROCESSED VIDEO PATH:", processed_video_path)
            print(
                "PROCESSED VIDEO EXISTS:",
    os.path.exists(processed_video_path)
    if processed_video_path
    else False,
)
            # ------------------------------------------------
            # FALLBACK
            # ------------------------------------------------

            try:

                shutil.copy2(
                    temp_video,
                    output_video,
                )

                processed_video_path = (
                    output_video
                )

                try:
                    os.remove(
                        temp_video
                    )
                except OSError:
                    pass

            except Exception as copy_error:

                raise RuntimeError(
                    "Unable to create processed video."
                ) from copy_error

    # ========================================================
    # JOINT RESULTS
    # ========================================================

    joint_angles = {
        "left_elbow": _build_joint_result(
            angle_data["left_elbow"]
        ),

        "right_elbow": _build_joint_result(
            angle_data["right_elbow"]
        ),

        "left_knee": _build_joint_result(
            angle_data["left_knee"]
        ),

        "right_knee": _build_joint_result(
            angle_data["right_knee"]
        ),

        "left_hip": _build_joint_result(
            angle_data["left_hip"]
        ),

        "right_hip": _build_joint_result(
            angle_data["right_hip"]
        ),
    }

    # ========================================================
    # PROCESSED VIDEO URL
    # ========================================================

    processed_video_url = None

    if processed_video_path:

        processed_video_url = (
            processed_video_path.replace(
                "\\",
                "/",
            )
        )

    # ========================================================
    # CHECK ANGLE DATA
    # ========================================================

    any_angle_data = any(
        bool(values)
        for values in angle_data.values()
    )

    if not any_angle_data:

        return _insufficient_result(
            total_frames=total_frames,
            pose_frames=pose_frames,
            success_rate=success_rate,
            processed_video_url=(
                processed_video_url
            ),
            joint_angles=joint_angles,
            fps=fps,
            duration_seconds=duration_seconds,
        )

    # ========================================================
    # BIOMECHANICAL ANALYSIS
    # ========================================================

    biomechanics = _build_biomechanics(
        angle_data
    )

    # ========================================================
    # ANOMALY DETECTION
    # ========================================================

    try:

        anomaly_detection = (
            detect_movement_anomalies(
                left_knee_angles=(
                    angle_data["left_knee"]
                ),

                right_knee_angles=(
                    angle_data["right_knee"]
                ),

                left_hip_angles=(
                    angle_data["left_hip"]
                ),

                right_hip_angles=(
                    angle_data["right_hip"]
                ),

                left_elbow_angles=(
                    angle_data["left_elbow"]
                ),

                right_elbow_angles=(
                    angle_data["right_elbow"]
                ),
            )
        )

    except Exception as error:

        print(
            "⚠️ Anomaly detection failed:"
        )

        print(error)

        anomaly_detection = {
            "analysis_available": False,
            "status": (
                "Anomaly detection failed."
            ),
            "error": str(error),
        }

    # ========================================================
    # INJURY PREDICTION
    # ========================================================

    try:

        injury_prediction = (
    predict_injury_risks(
        anomaly_data=anomaly_detection,
        biomechanics=biomechanics,
    )
)

    except Exception as error:

        print(
            "⚠️ Injury prediction failed:"
        )

        print(error)

        injury_prediction = {
            "analysis_available": False,
            "status": (
                "Injury prediction failed."
            ),
            "error": str(error),
        }

    # ========================================================
    # RISK CALCULATION
    # ========================================================

    #
    # IMPORTANT:
    #
    # Do NOT require every single joint to be available.
    #
    # The downstream risk engine receives:
    # - anomaly data
    # - injury prediction
    # - biomechanics
    #
    # and decides whether enough information exists.
    #

    try:

        risk = calculate_risk(
            anomaly_data=(
                anomaly_detection
            ),

            injury_prediction=(
                injury_prediction
            ),

            biomechanics=(
                biomechanics
            ),
        )

    except Exception as error:

        print(
            "⚠️ Risk calculation failed:"
        )

        print(error)

        risk = {
            "analysis_available": False,

            "risk_score": None,

            "risk_level": "Unknown",

            "risk_factors": [
                (
                    "Risk calculation could not "
                    "be completed."
                )
            ],

            "recommendations": [],

            "component_scores": {},

            "joint_scores": {},

            "highest_risk": {},

            "data_completeness": (
                biomechanics.get(
                    "data_completeness",
                    0,
                )
                if isinstance(
                    biomechanics,
                    dict,
                )
                else 0
            ),

            "remarks": [
                (
                    "Risk engine returned an error."
                )
            ],

            "error": str(error),
        }

    # ========================================================
    # RECOMMENDATIONS
    # ========================================================

    try:

        recommendations = (
            generate_recommendations(
                risk_data=risk,

                anomaly_data=(
                    anomaly_detection
                ),

                injury_prediction=(
                    injury_prediction
                ),

                biomechanics=(
                    biomechanics
                ),
            )
        )

    except Exception as error:

        print(
            "⚠️ Recommendation generation failed:"
        )

        print(error)

        recommendations = {
            "total_recommendations": 0,

            "recommendations": [],

            "analysis_status": (
                "Recommendation generation failed."
            ),

            "error": str(error),
        }

    # ========================================================
    # FINAL RESULT
    # ========================================================

    return {
        # ----------------------------------------------------
        # VIDEO INFORMATION
        # ----------------------------------------------------

        "frames": total_frames,

        "processed_frames": processed_frames,

        "pose_detected": pose_frames,

        "success_rate": success_rate,

        "fps": fps,

        "duration_seconds": duration_seconds,

        # ----------------------------------------------------
        # ANALYSIS STATUS
        # ----------------------------------------------------

        "analysis_status": (
            "Analysis completed."
        ),

        # ----------------------------------------------------
        # VIDEO OUTPUT
        # ----------------------------------------------------

        "processed_video": (
            processed_video_url
        ),

        # ----------------------------------------------------
        # JOINT ANGLES
        # ----------------------------------------------------

        "joint_angles": joint_angles,

        # ----------------------------------------------------
        # BIOMECHANICS
        # ----------------------------------------------------

        "biomechanics": biomechanics,

        # ----------------------------------------------------
        # ANOMALIES
        # ----------------------------------------------------

        "anomaly_detection": (
            anomaly_detection
        ),

        # ----------------------------------------------------
        # INJURY PREDICTION
        # ----------------------------------------------------

        "injury_prediction": (
            injury_prediction
        ),

        # ----------------------------------------------------
        # RISK
        # ----------------------------------------------------

        "risk_analysis": risk,

        # ----------------------------------------------------
        # RECOMMENDATIONS
        # ----------------------------------------------------

        "recommendations": (
            recommendations
        ),
    }