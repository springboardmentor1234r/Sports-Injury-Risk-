

import argparse
import sys

# Import colors for terminal output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'    # Low Risk
    YELLOW = '\033[93m'   # Moderate Risk
    ORANGE = '\033[38;5;208m' # High Risk
    RED = '\033[91m'      # Critical Risk
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def get_risk_color(risk_category):
    cat = risk_category.lower()
    if "low" in cat:
        return Colors.GREEN
    elif "moderate" in cat:
        return Colors.YELLOW
    elif "high" in cat:
        return Colors.ORANGE
    elif "critical" in cat:
        return Colors.RED
    return Colors.ENDC

def main():
    parser = argparse.ArgumentParser(description="Run the full Sports Injury Risk pipeline.")
def run_pipeline(athlete_id: str, video_name: str = None, source_path: str = None) -> dict:
    import os
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    try:
        from database import mongo_utils
        session_id = mongo_utils.generate_session_id()
    except ImportError:
        session_id = "temp_session"

    if source_path:
        from pose_extractor import extract_landmarks_from_video, save_to_csv
        print(f"\n{Colors.BLUE}Step 1: Running Pose Extractor (API/File)...{Colors.ENDC}")
        frames_data = extract_landmarks_from_video(source_path, is_webcam=False, save_annotated_video=True)
        save_to_csv(frames_data, source_path, is_webcam=False)
        video_name = video_name or os.path.splitext(os.path.basename(source_path))[0]
    elif not video_name:
        from pose_extractor import choose_input_source_interactively, extract_landmarks_from_video, save_to_csv
        
        print(f"{Colors.BLUE}No video_name provided. Launching full pipeline from the beginning...{Colors.ENDC}")
        print(f"\n{Colors.BLUE}Step 1: Running Pose Extractor...{Colors.ENDC}")
        source, is_webcam = choose_input_source_interactively()
        frames_data = extract_landmarks_from_video(source, is_webcam=is_webcam, save_annotated_video=True)
        save_to_csv(frames_data, source, is_webcam=is_webcam)
        video_name = "webcam_session" if is_webcam else os.path.splitext(os.path.basename(source))[0]
        
    print(f"\n{Colors.BLUE}Step 2: Running Biomechanics Analyzer...{Colors.ENDC}")
    from biomechanics.analyzer import run_biomechanics_only
    run_biomechanics_only(video_name, athlete_id, session_id)

    print(f"\n{Colors.BLUE}Step 3: Running Risk Scoring Engine...{Colors.ENDC}")
    # Import and run risk scoring silently
    from risk_scoring.engine import run_risk_scoring
    risk_df = run_risk_scoring(video_name, athlete_id, session_id, quiet=True)
    if risk_df.empty:
        print("Error: Risk scoring failed to produce data.")
        sys.exit(1)
    
    risk_data = risk_df.iloc[0].to_dict()

    # ==========================================
    # DISPLAY FINAL DASHBOARD (FAST SUMMARY)
    # ==========================================
    print("\n\n" + "=" * 80)
    print(f"{Colors.BOLD}{Colors.HEADER}1. HEADLINE SUMMARY{Colors.ENDC}")
    print("=" * 80)
    health_score = risk_data.get("overall_health_score", 0)
    risk_cat = risk_data.get("risk_category", "Unknown")
    color = get_risk_color(risk_cat)
    
    print(f"{Colors.BOLD}Overall Athlete Health Score : {health_score:.1f}/100{Colors.ENDC}")
    print(f"{Colors.BOLD}Risk Category                : {color}{risk_cat}{Colors.ENDC}")

    print("\n" + "=" * 80)
    print(f"{Colors.BOLD}{Colors.HEADER}2. SUPPORTING SCORES{Colors.ENDC}")
    print("=" * 80)
    print(f"Injury Risk Score            : {risk_data.get('final_risk_score', 0):.1f}/100")
    print(f"Movement Quality Score       : {risk_data.get('movement_quality_score', 0):.1f}/100")
    print(f"Biomechanical Efficiency     : {risk_data.get('biomechanical_efficiency_score', 0):.1f}/100")
    print(f"Fatigue Score                : {risk_data.get('fatigue_score', 0):.1f}/100")

    print("\n" + "=" * 80)
    print(f"{Colors.BOLD}{Colors.HEADER}3. DETECTED ISSUES{Colors.ENDC}")
    print("=" * 80)
    flagged_str = risk_data.get('flagged_issues', "None")
    if flagged_str == "None" or not flagged_str:
        print("- No significant movement issues detected.")
    else:
        for issue in str(flagged_str).split(" | "):
            print(f"- {issue.replace('_', ' ').capitalize()}")

    print("\n" + "-" * 80)
    print("Note: To generate corrective exercises and a detailed premium report,")
    print(f"run the recommendation engine manually for session: {session_id}")
    print("-" * 80 + "\n")

    # ==========================================
    # CLOUDINARY UPLOAD
    # ==========================================
    from config import ANNOTATED_VIDEO_DIR
    annotated_video_path = os.path.join(ANNOTATED_VIDEO_DIR, f"{video_name}_annotated.mp4")
    if os.path.exists(annotated_video_path):
        print(f"\n{Colors.BLUE}Uploading Annotated Video to Cloudinary...{Colors.ENDC}")
        try:
            from database.cloud_storage import upload_video
            from database.mongo_utils import update_session_video_url
            video_url = upload_video(annotated_video_path)
            if video_url:
                update_session_video_url(session_id, video_url)
        except ImportError:
            print("Could not import Cloudinary modules. Skipping upload.")

    # ==========================================
    # CSV CLEANUP
    # ==========================================
    from config import CSV_OUTPUT_DIR, SUMMARY_OUTPUT_DIR, ANNOTATED_VIDEO_DIR, RISK_SCORE_OUTPUT_DIR
    
    landmarks_csv = os.path.join(CSV_OUTPUT_DIR, f"{video_name}_landmarks.csv")
    biomechanics_csv = os.path.join(CSV_OUTPUT_DIR, f"{video_name}_biomechanics.csv")
    summary_csv = os.path.join(SUMMARY_OUTPUT_DIR, f"{video_name}_summary.csv")
    risk_score_csv = os.path.join(RISK_SCORE_OUTPUT_DIR, f"{video_name}_risk_score.csv")
    annotated_video = os.path.join(ANNOTATED_VIDEO_DIR, f"{video_name}_annotated.mp4")
    
    files_to_delete = [landmarks_csv, biomechanics_csv, summary_csv, risk_score_csv, annotated_video]
    deleted_count = 0
    for file_path in files_to_delete:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                deleted_count += 1
            except Exception as e:
                print(f"Warning: Could not delete {file_path}: {e}")
                
    # Safely try to remove empty directories
    directories_to_check = [SUMMARY_OUTPUT_DIR, CSV_OUTPUT_DIR]
    for directory in directories_to_check:
        if os.path.exists(directory):
            try:
                os.rmdir(directory)
            except OSError:
                pass # Directory not empty, which is fine

    if deleted_count > 0:
        print(f"Cleaned up {deleted_count} temporary CSV files and empty folders. Permanent records saved to MongoDB.")

    # Return summary data for the API
    return {
        "session_id": session_id,
        "risk_data": risk_data,
        "annotated_video_url": video_url if 'video_url' in locals() else None
    }

def main():
    parser = argparse.ArgumentParser(description="Run the full Sports Injury Risk pipeline.")
    parser.add_argument(
        "--video_name", required=False,
        help="Base name of the video (e.g. 'sports')"
    )
    parser.add_argument("--athlete_id", required=True, help="Athlete ID for the database")
    args = parser.parse_args()
    
    run_pipeline(args.athlete_id, args.video_name)

if __name__ == "__main__":
    main()
