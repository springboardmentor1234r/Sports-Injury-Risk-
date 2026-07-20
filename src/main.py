

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
        video_name = video_name or os.path.splitext(os.path.basename(source_path))[0]
        frames_data, key_image_paths = extract_landmarks_from_video(source_path, is_webcam=False, save_annotated_video=True, video_name=video_name)
        save_to_csv(frames_data, source_path, is_webcam=False, video_name=video_name)
    elif not video_name:
        from pose_extractor import choose_input_source_interactively, extract_landmarks_from_video, save_to_csv
        
        print(f"{Colors.BLUE}No video_name provided. Launching full pipeline from the beginning...{Colors.ENDC}")
        print(f"\n{Colors.BLUE}Step 1: Running Pose Extractor...{Colors.ENDC}")
        source, is_webcam = choose_input_source_interactively()
        video_name = "webcam_session" if is_webcam else os.path.splitext(os.path.basename(source))[0]
        frames_data, key_image_paths = extract_landmarks_from_video(source, is_webcam=is_webcam, save_annotated_video=True, video_name=video_name)
        save_to_csv(frames_data, source, is_webcam=is_webcam, video_name=video_name)
        
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

    # The risk data is returned to the API via the return statement below.

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
    # KEY MOMENTS IMAGES (BASE64)
    # ==========================================
    if 'key_image_paths' in locals() and key_image_paths:
        import base64
        key_moments_b64 = []
        print(f"\n{Colors.BLUE}Encoding Key Moment Images to Base64...{Colors.ENDC}")
        for img_path in key_image_paths:
            if os.path.exists(img_path):
                try:
                    with open(img_path, "rb") as image_file:
                        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                        key_moments_b64.append(encoded_string)
                except Exception as e:
                    print(f"Error encoding {img_path}: {e}")
        
        if key_moments_b64:
            try:
                from database.mongo_utils import update_session_key_moments
                update_session_key_moments(session_id, key_moments_b64)
                print(f"{Colors.GREEN}Successfully stored {len(key_moments_b64)} key moments in MongoDB.{Colors.ENDC}")
            except Exception as e:
                print(f"Error storing key moments in DB: {e}")

    # ==========================================
    # CSV CLEANUP
    # ==========================================
    from config import CSV_OUTPUT_DIR, SUMMARY_OUTPUT_DIR, ANNOTATED_VIDEO_DIR, RISK_SCORE_OUTPUT_DIR, ANNOTATED_IMAGES_DIR
    
    landmarks_csv = os.path.join(CSV_OUTPUT_DIR, f"{video_name}_landmarks.csv")
    biomechanics_csv = os.path.join(CSV_OUTPUT_DIR, f"{video_name}_biomechanics.csv")
    summary_csv = os.path.join(SUMMARY_OUTPUT_DIR, f"{video_name}_summary.csv")
    risk_score_csv = os.path.join(RISK_SCORE_OUTPUT_DIR, f"{video_name}_risk_score.csv")
    annotated_video = os.path.join(ANNOTATED_VIDEO_DIR, f"{video_name}_annotated.mp4")
    
    print(f"\n{Colors.BLUE}Cleaning up local files...{Colors.ENDC}")
    for file_path in [landmarks_csv, biomechanics_csv, summary_csv, risk_score_csv, annotated_video]:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"Deleted {os.path.basename(file_path)}")
        except Exception as e:
            print(f"Failed to delete {file_path}: {e}")

    # Delete key moment images — use glob as a safety net in case key_image_paths wasn't populated
    import glob
    img_pattern = os.path.join(ANNOTATED_IMAGES_DIR, f"{video_name}_frame_*.jpg")
    for img_path in glob.glob(img_pattern):
        try:
            os.remove(img_path)
            print(f"Deleted {os.path.basename(img_path)}")
        except Exception as e:
            print(f"Failed to delete {img_path}: {e}")

    print(f"\n{Colors.BOLD}{Colors.GREEN}Pipeline complete!{Colors.ENDC}")
    
    # Safely try to remove empty directories
    directories_to_check = [SUMMARY_OUTPUT_DIR, CSV_OUTPUT_DIR]
    for directory in directories_to_check:
        if os.path.exists(directory):
            try:
                os.rmdir(directory)
            except OSError:
                pass # Directory not empty, which is fine

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
