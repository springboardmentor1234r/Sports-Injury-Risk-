"""
risk_scoring_engine.py

Step 3 of the Sports Injury Risk Detection pipeline.

What this script does:
1. Reads sports_summary.csv       -> Biomechanical Deviations + Movement Asymmetry
2. Reads sports_biomechanics.csv  -> Fatigue (compares early vs late frames)
3. Reads athlete_profile.csv      -> Historical Injury Factors + Training Load
4. Calculates 5 sub-scores (0-100 each), combines them using the weighted
   formula from the project document, and produces a final Risk Score +
   Risk Category (Low / Moderate / High / Critical).
5. Also records WHICH specific checks were flagged, so the (future)
   Recommendation Engine can suggest relevant corrective exercises.
6. Saves everything to outputs/risk_scores/<video_name>_risk_score.csv

Usage (from the project root folder):
    python src/risk_scoring_engine.py --video_name sports
"""

import os
import argparse
import pandas as pd

from config import CSV_OUTPUT_DIR, SUMMARY_OUTPUT_DIR, ATHLETE_PROFILE_PATH, RISK_SCORE_OUTPUT_DIR
from biomechanics_analyzer import run_full_biomechanics_pipeline


# =========================================================================
# THRESHOLDS -- starting values, based on general sports-science knowledge.
# These are meant to be tuned later; they are NOT hard scientific constants.
# =========================================================================

ROM_MIN_NORMAL = 40      # degrees -- below this = too restricted (deviation)
ROM_MAX_NORMAL = 150     # degrees -- above this = possibly unstable (deviation)
JOINT_ALIGNMENT_THRESHOLD = 0.05   # normalized units
BALANCE_SWAY_THRESHOLD = 0.05      # normalized units
SYMMETRY_THRESHOLD_DEGREES = 15    # degrees -- avg left-right gap considered "asymmetric"
FATIGUE_KNEE_DECLINE_THRESHOLD = 10  # degrees -- knee angle drop from first half to second half

RISK_CATEGORY_BINS = [
    (0, 25, "Low Risk"),
    (25, 50, "Moderate Risk"),
    (50, 75, "High Risk"),
    (75, 100.01, "Critical Risk"),
]


def calculate_biomechanical_deviation_score(summary_row: pd.Series):
    """
    Checks ROM, joint alignment, and balance sway against thresholds.
    Returns (score 0-100, list of flagged issue descriptions).
    """
    flagged = []
    checks_total = 0

    rom_columns = [
        "left_knee_rom", "right_knee_rom",
        "left_hip_rom", "right_hip_rom",
        "left_elbow_rom", "right_elbow_rom",
        "left_ankle_rom", "right_ankle_rom",
    ]
    for col in rom_columns:
        if col not in summary_row:
            continue
        checks_total += 1
        value = summary_row[col]
        if value < ROM_MIN_NORMAL:
            flagged.append(f"{col} too low ({value:.1f} deg) - restricted movement")
        elif value > ROM_MAX_NORMAL:
            flagged.append(f"{col} too high ({value:.1f} deg) - possible instability")

    alignment_columns = ["left_joint_alignment_avg", "right_joint_alignment_avg"]
    for col in alignment_columns:
        if col not in summary_row:
            continue
        checks_total += 1
        value = summary_row[col]
        if value > JOINT_ALIGNMENT_THRESHOLD:
            flagged.append(f"{col} above threshold ({value:.3f}) - poor joint alignment")

    if "balance_sway" in summary_row:
        checks_total += 1
        value = summary_row["balance_sway"]
        if value > BALANCE_SWAY_THRESHOLD:
            flagged.append(f"balance_sway above threshold ({value:.3f}) - unstable balance")

    checks_total = max(checks_total, 1)  # avoid divide-by-zero
    score = (len(flagged) / checks_total) * 100
    return score, flagged


def calculate_asymmetry_score(summary_row: pd.Series):
    """
    Checks left-right symmetry averages against a threshold.
    Returns (score 0-100, list of flagged issue descriptions).
    """
    flagged = []
    symmetry_columns = ["knee_symmetry_avg", "hip_symmetry_avg", "elbow_symmetry_avg", "ankle_symmetry_avg"]
    checks_total = 0

    for col in symmetry_columns:
        if col not in summary_row:
            continue
        checks_total += 1
        value = summary_row[col]
        if value > SYMMETRY_THRESHOLD_DEGREES:
            flagged.append(f"{col} above threshold ({value:.1f} deg) - left/right asymmetry")

    checks_total = max(checks_total, 1)
    score = (len(flagged) / checks_total) * 100
    return score, flagged


def calculate_fatigue_score(biomechanics_df: pd.DataFrame):
    """
    Compares knee angle in the first half of the video vs the second half.
    A noticeable decline suggests fatigue (declining movement control).
    Returns (score 0-100, list of flagged issue descriptions).
    """
    flagged = []
    midpoint = len(biomechanics_df) // 2
    first_half = biomechanics_df.iloc[:midpoint]
    second_half = biomechanics_df.iloc[midpoint:]

    declines = []
    for col in ["left_knee_angle", "right_knee_angle"]:
        if col not in biomechanics_df.columns:
            continue
        first_avg = first_half[col].mean()
        second_avg = second_half[col].mean()
        decline = first_avg - second_avg  # positive = angle dropped in second half
        declines.append(decline)
        if decline > FATIGUE_KNEE_DECLINE_THRESHOLD:
            flagged.append(
                f"{col} dropped by {decline:.1f} deg in second half of session - possible fatigue"
            )

    if not declines:
        return 0, flagged

    avg_decline = sum(declines) / len(declines)
    # Scale: a 20-degree average decline maps to a 100 fatigue score (capped at 100, floored at 0)
    score = max(0, min(100, (avg_decline / 20) * 100))
    return score, flagged


def calculate_injury_history_score(profile_row: pd.Series):
    """Converts manually entered injury history into a 0-100 score."""
    if str(profile_row.get("has_previous_injury", "No")).strip().lower() != "yes":
        return 0, []

    recency = str(profile_row.get("injury_recency", "")).strip().lower()
    recency_scores = {"recent": 90, "moderate": 60, "old": 30}
    score = recency_scores.get(recency, 50)  # default 50 if recency is unclear

    injury_type = profile_row.get("previous_injury_type", "unspecified")
    flagged = [f"Previous {injury_type} injury ({profile_row.get('injury_recency', 'unknown recency')})"]
    return score, flagged


def calculate_training_load_score(profile_row: pd.Series):
    """Converts manually entered training load into a 0-100 score."""
    intensity = str(profile_row.get("training_intensity", "Medium")).strip().lower()
    intensity_scores = {"low": 20, "medium": 50, "high": 80}
    score = intensity_scores.get(intensity, 50)

    sessions = profile_row.get("weekly_training_sessions", 3)
    try:
        sessions = float(sessions)
    except (ValueError, TypeError):
        sessions = 3

    if sessions >= 6:
        score += 10
    elif sessions <= 2:
        score -= 10

    score = max(0, min(100, score))

    flagged = []
    if score >= 70:
        flagged.append(f"High training load ({sessions:.0f} sessions/week, {intensity} intensity)")

    return score, flagged


# def cleanup_intermediate_csvs(video_name: str):
#     """Deletes the temporary CSV files generated by the biomechanics pipeline."""
#     paths_to_delete = [
#         os.path.join(CSV_OUTPUT_DIR, f"{video_name}_landmarks.csv"),
#         os.path.join(CSV_OUTPUT_DIR, f"{video_name}_biomechanics.csv"),
#         os.path.join(SUMMARY_OUTPUT_DIR, f"{video_name}_summary.csv"),
#     ]
#     for path in paths_to_delete:
#         if os.path.exists(path):
#             os.remove(path)
#             print(f"Cleaned up temporary file: {path}")


def get_risk_category(final_score: float) -> str:
    for low, high, label in RISK_CATEGORY_BINS:
        if low <= final_score < high:
            return label
    return "Unknown"


def run_risk_scoring(video_name: str):
    # --- Load the three input files ---
    summary_path = os.path.join(SUMMARY_OUTPUT_DIR, f"{video_name}_summary.csv")
    biomechanics_path = os.path.join(CSV_OUTPUT_DIR, f"{video_name}_biomechanics.csv")

    summary_df = pd.read_csv(summary_path)
    biomechanics_df = pd.read_csv(biomechanics_path)
    profile_df = pd.read_csv(ATHLETE_PROFILE_PATH)

    summary_row = summary_df.iloc[0]     # one row per video
    profile_row = profile_df.iloc[0]     # for now, just use the first athlete profile row

    # --- Calculate each sub-score ---
    deviation_score, deviation_flags = calculate_biomechanical_deviation_score(summary_row)
    asymmetry_score, asymmetry_flags = calculate_asymmetry_score(summary_row)
    fatigue_score, fatigue_flags = calculate_fatigue_score(biomechanics_df)
    injury_score, injury_flags = calculate_injury_history_score(profile_row)
    training_score, training_flags = calculate_training_load_score(profile_row)

    # --- Combine using the weighted formula from the project document ---
    final_score = (
        deviation_score * 0.35
        + asymmetry_score * 0.20
        + injury_score * 0.20
        + training_score * 0.15
        + fatigue_score * 0.10
    )
    risk_category = get_risk_category(final_score)

    all_flags = deviation_flags + asymmetry_flags + fatigue_flags + injury_flags + training_flags

    # --- Build the result row ---
    result = {
        "video_name": video_name,
        "athlete_id": profile_row.get("athlete_id", "unknown"),
        "biomechanical_deviation_score": round(deviation_score, 1),
        "asymmetry_score": round(asymmetry_score, 1),
        "fatigue_score": round(fatigue_score, 1),
        "injury_history_score": round(injury_score, 1),
        "training_load_score": round(training_score, 1),
        "final_risk_score": round(final_score, 1),
        "risk_category": risk_category,
        "flagged_issues": " | ".join(all_flags) if all_flags else "None",
    }

    result_df = pd.DataFrame([result])

    os.makedirs(RISK_SCORE_OUTPUT_DIR, exist_ok=True)
    output_path = os.path.join(RISK_SCORE_OUTPUT_DIR, f"{video_name}_risk_score.csv")
    result_df.to_csv(output_path, index=False)

    # --- Print a readable summary ---
    print(f"\n{'='*60}")
    print(f"RISK SCORE REPORT: {video_name}")
    print(f"{'='*60}")
    print(f"Biomechanical Deviation Score : {deviation_score:.1f} / 100  (weight 35%)")
    print(f"Movement Asymmetry Score      : {asymmetry_score:.1f} / 100  (weight 20%)")
    print(f"Historical Injury Score       : {injury_score:.1f} / 100  (weight 20%)")
    print(f"Training Load Score           : {training_score:.1f} / 100  (weight 15%)")
    print(f"Fatigue Score                 : {fatigue_score:.1f} / 100  (weight 10%)")
    print(f"{'-'*60}")
    print(f"FINAL RISK SCORE              : {final_score:.1f} / 100")
    print(f"RISK CATEGORY                 : {risk_category}")
    print(f"{'='*60}")

    if all_flags:
        print("\nFlagged issues:")
        for flag in all_flags:
            print(f"  - {flag}")
    else:
        print("\nNo issues flagged.")

    print(f"\nSaved risk score CSV to: {output_path}")
    
    # Clean up temporary CSVs
    # cleanup_intermediate_csvs(video_name)

    return result_df


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Calculate injury risk score from biomechanics data.")
    parser.add_argument(
        "--video_name", required=False,
        help="Base name of the video (e.g. 'sports', matching sports_summary.csv / sports_biomechanics.csv)"
    )
    args = parser.parse_args()

    video_name = args.video_name
    if not video_name:
        print("No video_name provided. Launching full pipeline...")
        video_name = run_full_biomechanics_pipeline()

    run_risk_scoring(video_name)
