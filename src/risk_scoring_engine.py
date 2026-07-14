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
    Returns (combined_score 0-100, rom_score 0-100, alignment_balance_score 0-100, flagged list).

    ROM and alignment/balance are tracked SEPARATELY (not just combined) so they
    can be reused individually for the Biomechanical Efficiency Score and
    Movement Quality Score later.
    """
    flagged = []

    # ---- ROM checks ----
    rom_flagged_count = 0
    rom_checks_total = 0
    rom_columns = [
        "left_knee_rom", "right_knee_rom",
        "left_hip_rom", "right_hip_rom",
        "left_elbow_rom", "right_elbow_rom",
        "left_ankle_rom", "right_ankle_rom",
    ]
    for col in rom_columns:
        if col not in summary_row:
            continue
        rom_checks_total += 1
        value = summary_row[col]
        if value < ROM_MIN_NORMAL:
            flagged.append(f"{col} too low ({value:.1f} deg) - restricted movement")
            rom_flagged_count += 1
        elif value > ROM_MAX_NORMAL:
            flagged.append(f"{col} too high ({value:.1f} deg) - possible instability")
            rom_flagged_count += 1

    rom_checks_total = max(rom_checks_total, 1)
    rom_score = (rom_flagged_count / rom_checks_total) * 100

    # ---- Joint alignment + balance checks ----
    align_flagged_count = 0
    align_checks_total = 0

    alignment_columns = ["left_joint_alignment_avg", "right_joint_alignment_avg"]
    for col in alignment_columns:
        if col not in summary_row:
            continue
        align_checks_total += 1
        value = summary_row[col]
        if value > JOINT_ALIGNMENT_THRESHOLD:
            flagged.append(f"{col} above threshold ({value:.3f}) - poor joint alignment")
            align_flagged_count += 1

    if "balance_sway" in summary_row:
        align_checks_total += 1
        value = summary_row["balance_sway"]
        if value > BALANCE_SWAY_THRESHOLD:
            flagged.append(f"balance_sway above threshold ({value:.3f}) - unstable balance")
            align_flagged_count += 1

    align_checks_total = max(align_checks_total, 1)
    alignment_balance_score = (align_flagged_count / align_checks_total) * 100

    # ---- Combined score (used for the main Injury Risk Score, as before) ----
    total_flagged = rom_flagged_count + align_flagged_count
    total_checks = rom_checks_total + align_checks_total
    combined_score = (total_flagged / total_checks) * 100

    return combined_score, rom_score, alignment_balance_score, flagged


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


def get_risk_category(final_score: float) -> str:
    for low, high, label in RISK_CATEGORY_BINS:
        if low <= final_score < high:
            return label
    return "Unknown"


def calculate_movement_quality_score(asymmetry_score: float, alignment_balance_score: float) -> float:
    """
    Higher = better movement quality (opposite direction from risk scores).
    Based on symmetry + joint alignment/balance -- NOT injury history or training load,
    since those aren't about the movement itself.
    """
    avg_deviation = (asymmetry_score + alignment_balance_score) / 2
    return round(100 - avg_deviation, 1)


def calculate_biomechanical_efficiency_score(rom_score: float) -> float:
    """
    Higher = more efficient range of motion (opposite direction from the ROM
    deviation score -- not too restricted, not excessive).
    """
    return round(100 - rom_score, 1)


def calculate_overall_health_score(final_risk_score: float) -> float:
    """
    Single at-a-glance dashboard number. Higher = healthier.
    Simply the inverse of the final risk score, so it never contradicts it.
    """
    return round(100 - final_risk_score, 1)


def run_risk_scoring(video_name: str, quiet: bool = False):
    # --- Load the three input files ---
    summary_path = os.path.join(SUMMARY_OUTPUT_DIR, f"{video_name}_summary.csv")
    biomechanics_path = os.path.join(CSV_OUTPUT_DIR, f"{video_name}_biomechanics.csv")

    summary_df = pd.read_csv(summary_path)
    biomechanics_df = pd.read_csv(biomechanics_path)
    profile_df = pd.read_csv(ATHLETE_PROFILE_PATH)

    summary_row = summary_df.iloc[0]     # one row per video
    profile_row = profile_df.iloc[0]     # for now, just use the first athlete profile row

    # --- Calculate each sub-score ---
    deviation_score, rom_score, alignment_balance_score, deviation_flags = calculate_biomechanical_deviation_score(summary_row)
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

    # --- Additional dashboard-facing scores (Section 8 of the project doc) ---
    movement_quality_score = calculate_movement_quality_score(asymmetry_score, alignment_balance_score)
    biomechanical_efficiency_score = calculate_biomechanical_efficiency_score(rom_score)
    overall_health_score = calculate_overall_health_score(final_score)

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
        "movement_quality_score": movement_quality_score,
        "biomechanical_efficiency_score": biomechanical_efficiency_score,
        "overall_health_score": overall_health_score,
        "flagged_issues": " | ".join(all_flags) if all_flags else "None",
    }

    result_df = pd.DataFrame([result])

    os.makedirs(RISK_SCORE_OUTPUT_DIR, exist_ok=True)
    output_path = os.path.join(RISK_SCORE_OUTPUT_DIR, f"{video_name}_risk_score.csv")
    result_df.to_csv(output_path, index=False)

    if not quiet:
        # --- Print a readable summary ---
        print(f"\n{'='*60}")
        print("HEADLINE SUMMARY")
        print(f"{'='*60}")
        print(f"Overall Athlete Health Score : {overall_health_score:.1f} / 100")
        print(f"Risk Category                : {risk_category}")

        print(f"\n{'='*60}")
        print("SUPPORTING SCORES")
        print(f"{'='*60}")
        print(f"Final Risk Score             : {final_score:.1f} / 100")
        print(f"Movement Quality Score       : {movement_quality_score:.1f} / 100")
        print(f"Biomechanical Efficiency     : {biomechanical_efficiency_score:.1f} / 100")
        print(f"Fatigue Score                : {fatigue_score:.1f} / 100")

        print(f"\n{'='*60}")
        print("FLAGGED ISSUES")
        print(f"{'='*60}")
        if all_flags:
            for flag in all_flags:
                clean_flag = flag.replace("_", " ").capitalize()
                print(f"  - {clean_flag}")
        else:
            print("  - No issues flagged.")

        print(f"\nSaved risk score CSV to: {output_path}")

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
