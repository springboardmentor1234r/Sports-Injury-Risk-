

import os
import argparse
import pandas as pd
import sys
import json
import os

# Add the 'src' directory to path (for config imports)
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# Add the project root to path (for database imports)
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from src.config import CSV_OUTPUT_DIR, SUMMARY_OUTPUT_DIR, RISK_SCORE_OUTPUT_DIR

try:
    from database import mongo_utils
    MONGO_AVAILABLE = True
except ImportError:
    MONGO_AVAILABLE = False


from src.logger import get_logger

logger = get_logger("risk_scoring_engine")

from risk_scoring.rules import (
    calculate_biomechanical_deviation_score,
    calculate_asymmetry_score,
    calculate_fatigue_score,
    calculate_injury_history_score,
    calculate_training_load_score,
    get_demographics_flags,
    get_sport_flags,
    get_risk_category,
    calculate_movement_quality_score,
    calculate_biomechanical_efficiency_score,
    calculate_overall_health_score
)

def run_risk_scoring(video_name: str, athlete_id: str, session_id: str, quiet: bool = False):
    # --- Load the input data ---
    data_loaded = False
    if MONGO_AVAILABLE and session_id:
        try:
            bio_data = mongo_utils.get_biomechanics_data(session_id)
            summary_df = pd.DataFrame([bio_data["summary"]])
            biomechanics_df = pd.DataFrame(bio_data["frames"])
            data_loaded = True
        except Exception as e:
            logger.warning(f"MongoDB biomechanics data not found ({e}), falling back to CSV...")
            
    if not data_loaded:
        summary_path = os.path.join(SUMMARY_OUTPUT_DIR, f"{video_name}_summary.csv")
        biomechanics_path = os.path.join(CSV_OUTPUT_DIR, f"{video_name}_biomechanics.csv")
        summary_df = pd.read_csv(summary_path)
        biomechanics_df = pd.read_csv(biomechanics_path)
    
    # Load athlete profile from MongoDB instead of CSV
    if MONGO_AVAILABLE:
        profile_dict = mongo_utils.get_athlete_profile(athlete_id)
        profile_row = pd.Series(profile_dict)
    else:
        logger.warning("mongo_utils not imported, falling back to dummy profile")
        profile_row = pd.Series({"has_previous_injury": "No", "training_intensity": "Medium", "weekly_training_sessions": 3})

    summary_row = summary_df.iloc[0]     # one row per video

    # --- Calculate each sub-score ---
    deviation_score, rom_score, alignment_balance_score, deviation_flags = calculate_biomechanical_deviation_score(summary_row)
    asymmetry_score, asymmetry_flags = calculate_asymmetry_score(summary_row)
    fatigue_score, fatigue_flags = calculate_fatigue_score(biomechanics_df)
    injury_score, injury_flags = calculate_injury_history_score(profile_row)
    training_score, training_flags = calculate_training_load_score(profile_row)

    # --- Combine using the weighted formula from the project document ---
    raw_final_score = (
        deviation_score * 0.35
        + asymmetry_score * 0.20
        + injury_score * 0.20
        + training_score * 0.15
        + fatigue_score * 0.10
    )
    
    demo_flags = get_demographics_flags(profile_row)
    sport_flags = get_sport_flags(profile_row)
    
    final_score = raw_final_score
    final_score = max(0, min(100, final_score))
    
    risk_category = get_risk_category(final_score)

    # --- Additional dashboard-facing scores (Section 8 of the project doc) ---
    movement_quality_score = calculate_movement_quality_score(asymmetry_score, alignment_balance_score)
    biomechanical_efficiency_score = calculate_biomechanical_efficiency_score(rom_score)
    overall_health_score = calculate_overall_health_score(final_score)

    all_flags = deviation_flags + asymmetry_flags + fatigue_flags + injury_flags + training_flags + demo_flags + sport_flags

    # Determine valgus severity qualitatively instead of using fake geometric degrees
    left_valgus_max = abs(biomechanics_df["left_knee_valgus"]).max() if "left_knee_valgus" in biomechanics_df.columns else 0
    right_valgus_max = abs(biomechanics_df["right_knee_valgus"]).max() if "right_knee_valgus" in biomechanics_df.columns else 0
    peak_valgus_px = max(left_valgus_max, right_valgus_max)
    
    if peak_valgus_px < 0.03:
        valgus_severity = "Low"
    elif peak_valgus_px < 0.06:
        valgus_severity = "Moderate"
    else:
        valgus_severity = "High"

    # --- Build the result row ---
    result = {
        "video_name": video_name,
        "athlete_id": athlete_id,
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
        "valgus_severity": valgus_severity,
        "flagged_issues": all_flags if all_flags else [],
    }

    result_df = pd.DataFrame([result])

    os.makedirs(RISK_SCORE_OUTPUT_DIR, exist_ok=True)
    output_path = os.path.join(RISK_SCORE_OUTPUT_DIR, f"{video_name}_risk_score.csv")
    result_df.to_csv(output_path, index=False)

    # Save to MongoDB
    if MONGO_AVAILABLE:
        mongo_utils.save_risk_score(session_id, athlete_id, result)
        
        # Phase 1: High/Critical Risk Alert (System -> Coach)
        if "High" in risk_category or "Critical" in risk_category:
            from database.sql_utils import get_athlete_coach, get_user_by_id
            coach_data = get_athlete_coach(int(athlete_id))
            if coach_data and "coach_email" in coach_data:
                from database.sql_utils import get_user_by_email
                coach_user = get_user_by_email(coach_data["coach_email"])
                if coach_user:
                    coach_id = coach_user["id"]
                    athlete_info = get_user_by_id(int(athlete_id))
                    athlete_name = athlete_info.get("full_name", "An athlete") if athlete_info else "An athlete"
                    
                    mongo_utils.insert_notification(
                        recipient_id=int(coach_id),
                        notif_type="RISK_ALERT",
                        idempotency_key=f"risk_alert_{session_id}_{coach_id}",
                        title=f"{risk_category} Detected",
                        message=f"{athlete_name} has been flagged as {risk_category}. Please review their assessment immediately.",
                        action_link=f"/coach-dashboard/athletes/{athlete_id}/sessions/{session_id}"
                    )

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
                clean_flag = flag["issue"].replace("_", " ").capitalize()
                print(f"  - {clean_flag}")
        else:
            print("  - No issues flagged.")

        logger.info(f"Saved risk score CSV to: {output_path}")

    return result_df


def choose_biomechanics_csv_interactively() -> str:
    """Finds all _biomechanics.csv files and asks the user to pick one interactively."""
    if not os.path.isdir(CSV_OUTPUT_DIR):
        raise FileNotFoundError(f"Folder not found: {CSV_OUTPUT_DIR}. Run biomechanics analyzer first.")
        
    available_files = [f for f in os.listdir(CSV_OUTPUT_DIR) if f.endswith("_biomechanics.csv")]
    if not available_files:
        raise FileNotFoundError(f"No biomechanics CSVs found in {CSV_OUTPUT_DIR}. Run biomechanics analyzer first.")
        
    print(f"\nBiomechanics files found in {CSV_OUTPUT_DIR}:")
    for i, filename in enumerate(available_files, start=1):
        video_name = filename.replace("_biomechanics.csv", "")
        print(f"  {i}. {video_name}")
        
    selected = input(f"Enter the number of the data to score (1-{len(available_files)}): ").strip()
    
    try:
        selected_index = int(selected) - 1
        chosen_filename = available_files[selected_index]
        return chosen_filename.replace("_biomechanics.csv", "")
    except (ValueError, IndexError):
        raise ValueError("Invalid selection. Please run the script again and enter a valid number.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Calculate injury risk score from biomechanics data.")
    parser.add_argument(
        "--video_name", required=False,
        help="Base name of the video (e.g. 'sports', matching sports_summary.csv / sports_biomechanics.csv)"
    )
    parser.add_argument("--athlete_id", required=True, help="Athlete ID for the database")
    args = parser.parse_args()

    video_name = args.video_name
    if not video_name:
        video_name = choose_biomechanics_csv_interactively()

    session_id = mongo_utils.generate_session_id()
    run_risk_scoring(video_name, args.athlete_id, session_id)
