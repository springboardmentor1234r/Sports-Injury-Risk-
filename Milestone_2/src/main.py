

import argparse
import sys
import numpy as np
import pandas as pd

from src.logger import get_logger
logger = get_logger("main")

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

def publish_progress(session_id: str, step: str, progress: int):
    try:
        import redis
        import json
        from database.redis_utils import get_redis_url
        r = redis.from_url(get_redis_url())
        r.publish(f"session_progress_{session_id}", json.dumps({"step": step, "progress": progress}))
    except Exception as e:
        logger.warning(f"Failed to publish progress for {session_id}: {e}")

def run_pipeline(athlete_id: str, video_name: str = None, source_path: str = None, explicit_session_id: str = None) -> dict:
    import os
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    if explicit_session_id:
        session_id = explicit_session_id
    else:
        try:
            from database import mongo_utils
            session_id = mongo_utils.generate_session_id()
        except ImportError:
            session_id = "temp_session"

    frames_data = None
    
    if source_path:
        from src.pose_extractor import extract_landmarks_from_video, save_to_csv
        print(f"\n{Colors.BLUE}Step 1: Running Pose Extractor (API/File)...{Colors.ENDC}")
        publish_progress(session_id, "Extracting Joint Landmarks", 15)
        video_name = video_name or os.path.splitext(os.path.basename(source_path))[0]
        frames_data = extract_landmarks_from_video(source_path, is_webcam=False, save_annotated_video=True, video_name=video_name)
        save_to_csv(frames_data, source_path, is_webcam=False, video_name=video_name)
    else:
        # If no source_path is provided, ALWAYS require interactive selection.
        # This completely kills the dead "re-process by name" path.
        from src.pose_extractor import choose_input_source_interactively, extract_landmarks_from_video, save_to_csv
        print(f"{Colors.BLUE}No source_path provided. Launching full pipeline from the beginning...{Colors.ENDC}")
        print(f"\n{Colors.BLUE}Step 1: Running Pose Extractor...{Colors.ENDC}")
        source, is_webcam = choose_input_source_interactively()
        video_name = "webcam_session" if is_webcam else os.path.splitext(os.path.basename(source))[0]
        frames_data = extract_landmarks_from_video(source, is_webcam=is_webcam, save_annotated_video=True, video_name=video_name)
        save_to_csv(frames_data, source, is_webcam=is_webcam, video_name=video_name)
        
    actual_video_path = source_path if source_path else source
        
    print(f"\n{Colors.BLUE}Step 2: Running Biomechanics Analyzer...{Colors.ENDC}")
    publish_progress(session_id, "Analyzing Movement Mechanics", 40)
    from src.biomechanics.analyzer import run_biomechanics_only
    run_biomechanics_only(video_name, athlete_id, session_id, frames_data=frames_data)

    print(f"\n{Colors.BLUE}Step 3: Running Risk Scoring Engine...{Colors.ENDC}")
    publish_progress(session_id, "Generating AI Risk Profile", 65)
    # Import and run risk scoring silently
    from src.risk_scoring.engine import run_risk_scoring
    risk_df = run_risk_scoring(video_name, athlete_id, session_id, quiet=True)
    if risk_df.empty:
        raise RuntimeError("Risk scoring failed to produce data.")
    
    risk_data = risk_df.replace({np.nan: None}).iloc[0].to_dict()

    # The risk data is returned to the API via the return statement below.

    video_url = None

    # ==========================================
    # KEY MOMENTS IMAGES (BASE64)
    # ==========================================
    # 1. Load biomechanics CSV to get AI-detected squat frames
    from src.config import CSV_OUTPUT_DIR, SUMMARY_OUTPUT_DIR, ANNOTATED_VIDEO_DIR, RISK_SCORE_OUTPUT_DIR, ANNOTATED_IMAGES_DIR
    from src.risk_scoring.rules import get_key_moment_frames
    
    biomechanics_csv = os.path.join(CSV_OUTPUT_DIR, f"{video_name}_biomechanics.csv")
    if os.path.exists(biomechanics_csv):
        bio_df = pd.read_csv(biomechanics_csv)
        landmarks_path = os.path.join(CSV_OUTPUT_DIR, f"{video_name}_landmarks.csv")
        if os.path.exists(landmarks_path):
            landmarks_df = pd.read_csv(landmarks_path)
            key_frames = get_key_moment_frames(bio_df, max_frames=4, landmarks_df=landmarks_df)
        else:
            key_frames = get_key_moment_frames(bio_df, max_frames=4)
        

        
        # 2. Capture those precise frames instantly
        if key_frames:
            from src.capture_key_frames import capture_frames
            key_image_paths = capture_frames(actual_video_path, key_frames, ANNOTATED_IMAGES_DIR, video_name)

        else:
            key_image_paths = []
    else:

        key_image_paths = []

    if key_image_paths:
        key_moments_urls = []
        print(f"\n{Colors.BLUE}Uploading Key Moment Images to Cloudinary...{Colors.ENDC}")
        publish_progress(session_id, "Capturing Visual Evidence", 85)
        # Bypass Cloudinary Upload as requested by user
        if key_moments_urls is None:
            key_moments_urls = []
            logger.debug(f"Extracted key moments URLs: {key_moments_urls}")
            try:
                from database.mongo_utils import update_session_key_moments
                update_session_key_moments(session_id, key_moments_urls)
                logger.info(f"Successfully stored {len(key_moments_urls)} key moment URLs in MongoDB.")
            except Exception as e:
                logger.error(f"Error storing key moments in DB: {e}")

    # ==========================================
    # CSV CLEANUP
    # ==========================================
    
    landmarks_csv = os.path.join(CSV_OUTPUT_DIR, f"{video_name}_landmarks.csv")
    summary_csv = os.path.join(SUMMARY_OUTPUT_DIR, f"{video_name}_summary.csv")
    risk_score_csv = os.path.join(RISK_SCORE_OUTPUT_DIR, f"{video_name}_risk_score.csv")
    annotated_video = os.path.join(ANNOTATED_VIDEO_DIR, f"{video_name}_annotated.mp4")
    
    print(f"\n{Colors.BLUE}Cleaning up local files...{Colors.ENDC}")
    for file_path in [landmarks_csv, biomechanics_csv, summary_csv, risk_score_csv, annotated_video]:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Deleted {os.path.basename(file_path)}")
        except Exception as e:
            logger.warning(f"Failed to delete {file_path}: {e}")

    # Delete key moment images — use glob as a safety net in case key_image_paths wasn't populated
    import glob
    img_pattern = os.path.join(ANNOTATED_IMAGES_DIR, f"{video_name}_frame_*.jpg")
    for img_path in glob.glob(img_pattern):
        try:
            os.remove(img_path)
            logger.info(f"Deleted {os.path.basename(img_path)}")
        except Exception as e:
            logger.warning(f"Failed to delete {img_path}: {e}")

    print(f"\n{Colors.BOLD}{Colors.GREEN}Pipeline complete!{Colors.ENDC}")
    publish_progress(session_id, "Analysis Complete", 100)
    

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
