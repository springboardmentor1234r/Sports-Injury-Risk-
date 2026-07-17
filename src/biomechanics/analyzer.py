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

import sys
import os
import argparse

# Add the 'src' directory to path (for config imports)
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# Add the project root to path (for database imports)
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from config import CSV_OUTPUT_DIR, SUMMARY_OUTPUT_DIR

try:
    from database import mongo_utils
except ImportError:
    pass


from biomechanics.calculators import calculate_joint_angles_and_symmetry, calculate_trunk_valgus_and_stability, calculate_alignment_balance_stride, calculate_range_of_motion


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


def run_biomechanics_only(video_name: str, athlete_id: str, session_id: str) -> str:
    """Reads existing landmarks CSV and calculates biomechanics. Returns video_name."""
    
    # Save the initial session document to MongoDB
    try:
        mongo_utils.save_session(session_id, athlete_id, video_name, "Processing Biomechanics")
    except NameError:
        pass # mongo_utils not imported
        
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
    
    # Save biomechanics data to MongoDB
    try:
        frames_data = biomechanics_df.to_dict(orient="records")
        summary_data = summary_df.iloc[0].to_dict()
        mongo_utils.save_biomechanics_data(session_id, frames_data, summary_data)
    except NameError:
        pass # mongo_utils not imported
    
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
    parser.add_argument("--athlete_id", required=True, help="Athlete ID for the database")
    args = parser.parse_args()
    
    video_name = args.video_name
    if not video_name:
        video_name = choose_landmark_csv_interactively()
        
    session_id = mongo_utils.generate_session_id()
    run_biomechanics_only(video_name, args.athlete_id, session_id)