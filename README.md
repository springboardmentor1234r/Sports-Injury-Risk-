# Sports Injury Risk Detection

A computer vision pipeline to analyze athletic movements (like squats, jumps, etc.) and calculate a risk score for potential injuries.

## What's Built So Far (Step 1)
- **Pose Extraction Module (`src/pose_extractor.py`)**: 
  - Reads videos or live webcam feed using OpenCV.
  - Extracts 33 body landmarks using the newer MediaPipe Tasks API (`PoseLandmarker`).
  - Automatically downloads the required pose model if missing.
  - Draws the detected skeleton on the frame using OpenCV.
  - Outputs an annotated video (`outputs/annotated_videos/`).
  - Saves the landmark coordinates (x, y, z, visibility) for every frame into a CSV file (`outputs/csv/`) for further biomechanical analysis.
- **Configurations (`src/config.py`)**: Stores constants like landmark names and directory paths.

## Next Steps
- **Step 2**: Compute biomechanical angles (knee flexion, trunk lean, asymmetry) from the extracted CSV data.
- **Step 3**: Map biomechanical deviations to an injury risk score and provide corrective recommendations.