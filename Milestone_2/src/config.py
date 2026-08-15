"""
config.py

Central place for constants used across the pose extraction pipeline.
Keeping these here means Step 2 (biomechanics) can import the same
landmark names instead of retyping them.
"""

# MediaPipe Pose gives back 33 landmarks, in this fixed order.
# The index of each name in this list matches MediaPipe's own landmark index.
LANDMARK_NAMES = [
    "nose",
    "left_eye_inner", "left_eye", "left_eye_outer",
    "right_eye_inner", "right_eye", "right_eye_outer",
    "left_ear", "right_ear",
    "mouth_left", "mouth_right",
    "left_shoulder", "right_shoulder",
    "left_elbow", "right_elbow",
    "left_wrist", "right_wrist",
    "left_pinky", "right_pinky",
    "left_index", "right_index",
    "left_thumb", "right_thumb",
    "left_hip", "right_hip",
    "left_knee", "right_knee",
    "left_ankle", "right_ankle",
    "left_heel", "right_heel",
    "left_foot_index", "right_foot_index",
]

import os
from dotenv import load_dotenv

# Get the absolute path to the root of the project (parent of 'src' folder)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Folder paths (absolute based on project root)
RAW_VIDEOS_DIR = os.path.join(PROJECT_ROOT, "data", "raw_videos")
CSV_OUTPUT_DIR = os.path.join(PROJECT_ROOT, "outputs", "csv's")
ANNOTATED_VIDEO_DIR = os.path.join(PROJECT_ROOT, "outputs", "annotated_videos")
SUMMARY_OUTPUT_DIR = os.path.join(PROJECT_ROOT, "outputs", "csv's", "summary")

# Athlete profile (manually filled in) -- provides Historical Injury Factors
# and Training Load data, which cannot be derived from video.
ATHLETE_PROFILE_PATH = os.path.join(PROJECT_ROOT, "data", "profiles", "athlete_profile.csv")

# Where the final risk score results get saved
RISK_SCORE_OUTPUT_DIR = os.path.join(PROJECT_ROOT, "outputs", "risk_scores")

# Where the final recommendations get saved
RECOMMENDATION_OUTPUT_DIR = os.path.join(PROJECT_ROOT, "outputs", "recommendations")

# Where key moment annotated images are temporarily saved
ANNOTATED_IMAGES_DIR = os.path.join(PROJECT_ROOT, "outputs", "annotated_images")

# Model path for MediaPipe
MODEL_PATH = os.path.join(PROJECT_ROOT, "models", "pose_landmarker_full.task")

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "sports_injury_db")