"""
biomechanics_analyzer.py

Step 2 of the Sports Injury Risk Detection pipeline.

This script only performs biomechanical math.
It reads an existing `outputs/csv/` <video_name>_landmarks.csv file,
calculates joint angles, symmetry, valgus, etc., and saves the results to:
      <video_name>_biomechanics.csv    (per-frame angles)
      outputs/csv/summary/<video_name>_summary.csv (whole-video summary)

Usage (from the project root folder):
    python src/biomechanics_analyzer.py --video_name <video_name>
"""

import os
import numpy as np
import pandas as pd

import argparse
from config import CSV_OUTPUT_DIR, SUMMARY_OUTPUT_DIR


def calculate_angle(ax, ay, bx, by, cx, cy):
    """
    Calculates the angle (in degrees) at point B, formed by the lines B->A and B->C.
    Vectorized: works on entire pandas columns at once (all frames in one call).

    Points:
        A = hip
        B = knee   (the "vertex" -- angle is measured AT this point)
        C = ankle
    """
    ba_x = ax - bx
    ba_y = ay - by
    bc_x = cx - bx
    bc_y = cy - by

    angle_ba = np.arctan2(ba_y, ba_x)
    angle_bc = np.arctan2(bc_y, bc_x)

    angle_rad = np.abs(angle_ba - angle_bc)
    angle_rad = np.where(angle_rad > np.pi, (2 * np.pi) - angle_rad, angle_rad)

    angle_deg = np.degrees(angle_rad)
    return angle_deg


def calculate_joint_angles_and_symmetry(df: pd.DataFrame) -> pd.DataFrame:
    """
    Calculates left/right angles for knee, hip, elbow, and ankle for every frame,
    plus a symmetry column for each (the difference between left and right).

    Returns a new DataFrame with frame_number, timestamp_sec, all angle columns,
    and all symmetry columns.
    """
    result = pd.DataFrame()
    result["frame_number"] = df["frame_number"]
    result["timestamp_sec"] = df["timestamp_sec"]

    # ---- KNEE ANGLE: hip -> knee -> ankle ----
    result["left_knee_angle"] = calculate_angle(
        df["left_hip_x"], df["left_hip_y"],
        df["left_knee_x"], df["left_knee_y"],
        df["left_ankle_x"], df["left_ankle_y"],
    )
    result["right_knee_angle"] = calculate_angle(
        df["right_hip_x"], df["right_hip_y"],
        df["right_knee_x"], df["right_knee_y"],
        df["right_ankle_x"], df["right_ankle_y"],
    )

    # ---- HIP ANGLE: shoulder -> hip -> knee ----
    result["left_hip_angle"] = calculate_angle(
        df["left_shoulder_x"], df["left_shoulder_y"],
        df["left_hip_x"], df["left_hip_y"],
        df["left_knee_x"], df["left_knee_y"],
    )
    result["right_hip_angle"] = calculate_angle(
        df["right_shoulder_x"], df["right_shoulder_y"],
        df["right_hip_x"], df["right_hip_y"],
        df["right_knee_x"], df["right_knee_y"],
    )

    # ---- ELBOW ANGLE: shoulder -> elbow -> wrist ----
    result["left_elbow_angle"] = calculate_angle(
        df["left_shoulder_x"], df["left_shoulder_y"],
        df["left_elbow_x"], df["left_elbow_y"],
        df["left_wrist_x"], df["left_wrist_y"],
    )
    result["right_elbow_angle"] = calculate_angle(
        df["right_shoulder_x"], df["right_shoulder_y"],
        df["right_elbow_x"], df["right_elbow_y"],
        df["right_wrist_x"], df["right_wrist_y"],
    )

    # ---- ANKLE ANGLE: knee -> ankle -> foot_index (toe) ----
    result["left_ankle_angle"] = calculate_angle(
        df["left_knee_x"], df["left_knee_y"],
        df["left_ankle_x"], df["left_ankle_y"],
        df["left_foot_index_x"], df["left_foot_index_y"],
    )
    result["right_ankle_angle"] = calculate_angle(
        df["right_knee_x"], df["right_knee_y"],
        df["right_ankle_x"], df["right_ankle_y"],
        df["right_foot_index_x"], df["right_foot_index_y"],
    )

    # ---- SYMMETRY: absolute difference between left and right, per joint ----
    # A value near 0 = both sides moving the same way (symmetric).
    # A large value = one side is doing something noticeably different
    # (can indicate compensation, weakness, or an old injury favoring one side).
    result["knee_symmetry"] = (result["left_knee_angle"] - result["right_knee_angle"]).abs()
    result["hip_symmetry"] = (result["left_hip_angle"] - result["right_hip_angle"]).abs()
    result["elbow_symmetry"] = (result["left_elbow_angle"] - result["right_elbow_angle"]).abs()
    result["ankle_symmetry"] = (result["left_ankle_angle"] - result["right_ankle_angle"]).abs()

    return result


def calculate_trunk_valgus_and_stability(df: pd.DataFrame) -> pd.DataFrame:
    """
    Calculates trunk lean, knee valgus (left & right), and hip stability
    for every frame. These are all per-frame values, same as the joint angles.

    Returns a DataFrame with frame_number, timestamp_sec, and these new columns
    (meant to be merged with the joint angle / symmetry results).
    """
    result = pd.DataFrame()
    result["frame_number"] = df["frame_number"]
    result["timestamp_sec"] = df["timestamp_sec"]

    # ---- TRUNK LEAN ----
    # Midpoint between the two shoulders, and midpoint between the two hips.
    shoulder_mid_x = (df["left_shoulder_x"] + df["right_shoulder_x"]) / 2
    shoulder_mid_y = (df["left_shoulder_y"] + df["right_shoulder_y"]) / 2
    hip_mid_x = (df["left_hip_x"] + df["right_hip_x"]) / 2
    hip_mid_y = (df["left_hip_y"] + df["right_hip_y"]) / 2

    # Vector from hip midpoint to shoulder midpoint (this represents the trunk/torso)
    trunk_dx = shoulder_mid_x - hip_mid_x
    trunk_dy = shoulder_mid_y - hip_mid_y

    # Compare this vector to a perfectly vertical line.
    # In image coordinates, y increases DOWNWARD, so "straight up" is (dx=0, dy=negative).
    # arctan2(dx, -dy) gives 0 degrees when the trunk is perfectly vertical,
    # and larger values the more the trunk leans to either side.
    trunk_lean_rad = np.arctan2(trunk_dx.abs(), -trunk_dy)
    result["trunk_lean"] = np.degrees(trunk_lean_rad)

    # ---- KNEE VALGUS (left & right) ----
    # If hip and ankle were connected by a straight line, where SHOULD the knee be
    # (horizontally) at the knee's actual height? Compare that to where the knee
    # ACTUALLY is. A big gap means the knee is caving in/out relative to a straight leg.
    def knee_valgus_offset(hip_x, hip_y, knee_x, knee_y, ankle_x, ankle_y):
        # t = how far down the knee is, between hip (t=0) and ankle (t=1), vertically
        vertical_span = (ankle_y - hip_y)
        # avoid divide-by-zero in case hip_y and ankle_y are ever identical
        vertical_span = vertical_span.replace(0, np.nan)
        t = (knee_y - hip_y) / vertical_span

        expected_knee_x = hip_x + t * (ankle_x - hip_x)
        offset = knee_x - expected_knee_x
        return offset

    result["left_knee_valgus"] = knee_valgus_offset(
        df["left_hip_x"], df["left_hip_y"],
        df["left_knee_x"], df["left_knee_y"],
        df["left_ankle_x"], df["left_ankle_y"],
    )
    result["right_knee_valgus"] = knee_valgus_offset(
        df["right_hip_x"], df["right_hip_y"],
        df["right_knee_x"], df["right_knee_y"],
        df["right_ankle_x"], df["right_ankle_y"],
    )

    # ---- HIP STABILITY ----
    # Difference in height between left and right hip.
    # A value near 0 means the pelvis is staying level; a larger value means
    # one side of the pelvis is dropping relative to the other.
    result["hip_stability"] = (df["left_hip_y"] - df["right_hip_y"]).abs()

    return result


def calculate_alignment_balance_stride(df: pd.DataFrame) -> pd.DataFrame:
    """
    Calculates joint alignment (left & right), a balance/center-of-mass tracking
    column, and stride length -- all per frame.
    """
    result = pd.DataFrame()
    result["frame_number"] = df["frame_number"]
    result["timestamp_sec"] = df["timestamp_sec"]

    # ---- JOINT ALIGNMENT ----
    # True perpendicular distance from the knee to the straight hip-ankle line
    # (fuller picture than valgus, which only looked at horizontal drift).
    def perpendicular_distance(hip_x, hip_y, knee_x, knee_y, ankle_x, ankle_y):
        line_x = ankle_x - hip_x
        line_y = ankle_y - hip_y
        point_x = knee_x - hip_x
        point_y = knee_y - hip_y

        # 2D cross product magnitude = area of the parallelogram formed by the two vectors
        cross = (line_x * point_y - line_y * point_x).abs()

        line_length = np.sqrt(line_x**2 + line_y**2)
        line_length = line_length.replace(0, np.nan)  # avoid divide-by-zero

        distance = cross / line_length
        return distance

    result["left_joint_alignment"] = perpendicular_distance(
        df["left_hip_x"], df["left_hip_y"],
        df["left_knee_x"], df["left_knee_y"],
        df["left_ankle_x"], df["left_ankle_y"],
    )
    result["right_joint_alignment"] = perpendicular_distance(
        df["right_hip_x"], df["right_hip_y"],
        df["right_knee_x"], df["right_knee_y"],
        df["right_ankle_x"], df["right_ankle_y"],
    )

    # ---- BALANCE / CENTER OF MASS TRACKING ----
    # Midpoint between the two hips approximates the body's center of mass.
    # We store its x-position per frame here; the actual "sway" (how much it
    # wobbles across the whole video) is calculated later, in the summary step.
    result["hip_mid_x"] = (df["left_hip_x"] + df["right_hip_x"]) / 2

    # ---- STRIDE LENGTH ----
    # Straight-line distance between left and right ankle, per frame.
    result["stride_length"] = np.sqrt(
        (df["left_ankle_x"] - df["right_ankle_x"])**2
        + (df["left_ankle_y"] - df["right_ankle_y"])**2
    )

    return result


def calculate_range_of_motion(biomechanics_df: pd.DataFrame) -> pd.DataFrame:
    """
    Calculates Range of Motion (ROM) for each joint angle, across the WHOLE video.

    Unlike the per-frame angle columns (one value per frame), ROM is a single
    summary number per joint: ROM = max(angle) - min(angle) across all frames.

    Returns a DataFrame with exactly ONE row (this video's summary).
    """
    joint_angle_columns = [
        "left_knee_angle", "right_knee_angle",
        "left_hip_angle", "right_hip_angle",
        "left_elbow_angle", "right_elbow_angle",
        "left_ankle_angle", "right_ankle_angle",
    ]

    summary_data = {}
    for col in joint_angle_columns:
        rom_column_name = col.replace("_angle", "_rom")  # e.g. left_knee_angle -> left_knee_rom
        summary_data[rom_column_name] = [biomechanics_df[col].max() - biomechanics_df[col].min()]

    # Also include average symmetry across the whole video (useful at-a-glance summary)
    symmetry_columns = ["knee_symmetry", "hip_symmetry", "elbow_symmetry", "ankle_symmetry"]
    for col in symmetry_columns:
        avg_column_name = col.replace("_symmetry", "_symmetry_avg")
        summary_data[avg_column_name] = [biomechanics_df[col].mean()]

    # Balance / sway: how much the center-of-mass (hip midpoint) wobbled
    # side to side across the WHOLE video. This only makes sense as a
    # whole-video summary number, not a per-frame value.
    if "hip_mid_x" in biomechanics_df.columns:
        summary_data["balance_sway"] = [
            biomechanics_df["hip_mid_x"].max() - biomechanics_df["hip_mid_x"].min()
        ]

    # Average stride length and joint alignment across the video
    if "stride_length" in biomechanics_df.columns:
        summary_data["avg_stride_length"] = [biomechanics_df["stride_length"].mean()]
    if "left_joint_alignment" in biomechanics_df.columns:
        summary_data["left_joint_alignment_avg"] = [biomechanics_df["left_joint_alignment"].mean()]
        summary_data["right_joint_alignment_avg"] = [biomechanics_df["right_joint_alignment"].mean()]

    return pd.DataFrame(summary_data)


def save_landmarks_csv(frames_data, video_name: str) -> str:
    """Saves the raw landmarks (from pose_extractor) to outputs/csv/<name>_landmarks.csv"""
    os.makedirs(CSV_OUTPUT_DIR, exist_ok=True)
    path = os.path.join(CSV_OUTPUT_DIR, f"{video_name}_landmarks.csv")
    pd.DataFrame(frames_data).to_csv(path, index=False)
    return path


def save_biomechanics_csv(biomechanics_df: pd.DataFrame, video_name: str) -> str:
    """Saves the calculated biomechanics data to outputs/csv/<name>_biomechanics.csv"""
    os.makedirs(CSV_OUTPUT_DIR, exist_ok=True)
    path = os.path.join(CSV_OUTPUT_DIR, f"{video_name}_biomechanics.csv")
    biomechanics_df.to_csv(path, index=False)
    return path


def save_summary_csv(summary_df: pd.DataFrame, video_name: str) -> str:
    """Saves the one-row-per-video summary (ROM, avg symmetry, etc.) to outputs/summary/<name>_summary.csv"""
    os.makedirs(SUMMARY_OUTPUT_DIR, exist_ok=True)
    path = os.path.join(SUMMARY_OUTPUT_DIR, f"{video_name}_summary.csv")
    summary_df.to_csv(path, index=False)
    return path


def run_biomechanics_only(video_name: str) -> str:
    """Reads existing landmarks CSV and calculates biomechanics. Returns video_name."""
    landmarks_path = os.path.join(CSV_OUTPUT_DIR, f"{video_name}_landmarks.csv")
    
    if not os.path.exists(landmarks_path):
        raise FileNotFoundError(f"Landmarks file not found: {landmarks_path}. Run pose_extractor.py first.")
        
    landmarks_df = pd.read_csv(landmarks_path)

    # --- Step 2: Biomechanical analysis ---
    biomechanics_df = calculate_joint_angles_and_symmetry(landmarks_df)

    # Add trunk lean, knee valgus, and hip stability (merge on frame_number/timestamp)
    extra_metrics_df = calculate_trunk_valgus_and_stability(landmarks_df)
    biomechanics_df = biomechanics_df.merge(
        extra_metrics_df, on=["frame_number", "timestamp_sec"]
    )

    # Add joint alignment, balance tracking, and stride length
    alignment_balance_df = calculate_alignment_balance_stride(landmarks_df)
    biomechanics_df = biomechanics_df.merge(
        alignment_balance_df, on=["frame_number", "timestamp_sec"]
    )

    biomechanics_path = save_biomechanics_csv(biomechanics_df, video_name)
    print(f"Saved biomechanics CSV to: {biomechanics_path}")

    # --- Step 2b: Range of Motion + symmetry averages (one-row summary) ---
    summary_df = calculate_range_of_motion(biomechanics_df)
    summary_path = save_summary_csv(summary_df, video_name)
    print(f"Saved summary CSV to: {summary_path}")
    
    return video_name


def choose_landmark_csv_interactively() -> str:
    """Finds all _landmarks.csv files and asks the user to pick one interactively."""
    if not os.path.isdir(CSV_OUTPUT_DIR):
        raise FileNotFoundError(f"Folder not found: {CSV_OUTPUT_DIR}. Run pose extraction first.")
        
    available_files = [f for f in os.listdir(CSV_OUTPUT_DIR) if f.endswith("_landmarks.csv")]
    if not available_files:
        raise FileNotFoundError(f"No landmarks CSVs found in {CSV_OUTPUT_DIR}. Run pose extraction first.")
        
    print(f"\nLandmark files found in {CSV_OUTPUT_DIR}:")
    for i, filename in enumerate(available_files, start=1):
        # Extract the video_name (everything before _landmarks.csv)
        video_name = filename.replace("_landmarks.csv", "")
        print(f"  {i}. {video_name}")
        
    selected = input(f"Enter the number of the data to process (1-{len(available_files)}): ").strip()
    
    try:
        selected_index = int(selected) - 1
        chosen_filename = available_files[selected_index]
        return chosen_filename.replace("_landmarks.csv", "")
    except (ValueError, IndexError):
        raise ValueError("Invalid selection. Please run the script again and enter a valid number.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Calculate biomechanics from existing landmarks CSV.")
    parser.add_argument("--video_name", required=False, help="Base name of the video (e.g. 'sports')")
    args = parser.parse_args()
    
    video_name = args.video_name
    if not video_name:
        video_name = choose_landmark_csv_interactively()
        
    run_biomechanics_only(video_name)