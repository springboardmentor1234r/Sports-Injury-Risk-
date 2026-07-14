# Sports Injury Risk Detection

A computer vision pipeline to analyze athletic movements (like squats, jumps, etc.) and calculate a risk score for potential injuries.

The project is now a fully automated, end-to-end pipeline consisting of three integrated steps:

1. **Pose Extraction (`src/pose_extractor.py`)**: 
   - Reads videos or a live webcam feed using OpenCV.
   - Extracts 33 body landmarks using the MediaPipe Tasks API (`PoseLandmarker`).
   - Generates raw `x, y, z` coordinates for every frame.

2. **Biomechanical Analysis (`src/biomechanics_analyzer.py`)**: 
   - Converts raw landmarks into meaningful physical metrics.
   - Calculates joint angles (knee flexion, hip/elbow angles), balance sway, knee valgus, and left-vs-right body asymmetry.
   - Outputs summarized biomechanical data.

3. **Risk Scoring Engine (`src/risk_scoring_engine.py`)**: 
   - The master script that drives the entire pipeline.
   - Merges biomechanical deviations, movement asymmetries, fatigue analysis, and the athlete's historical injury/training load (from `data/profiles/athlete_profile.csv`).
   - Calculates a final Risk Score (0-100) and assigns a Risk Category (Low / Moderate / High / Critical) while flagging specific issues.

## Usage

You can run the entire pipeline with a single command from the project root:

```bash
python src/risk_scoring_engine.py
```

- It will prompt you to select a video from `data/raw_videos/` or use your webcam.
- It will automatically process the pose extraction, calculate the biomechanics, and print the **Risk Score Report** in your terminal.
- Finally, it will clean up all temporary data and save your final risk score report to `outputs/risk_scores/`.

## Configurations (`src/config.py`)
Stores constants like landmark names and directory paths (e.g., `outputs/csv's/`).