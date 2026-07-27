# Milestone 2: Week 3 & 4 — Pose Estimation & Biomechanical Analysis

This directory contains the completed implementation for **Milestone 2** of the Sports Injury Risk Detection platform.

## 📋 Task List & Completion Status

- [x] **Implement Pose Estimation Engine**
  - Integrated Google MediaPipe Pose Landmarkers inside the backend pipeline to detect and extract 33 body keypoint landmarks in real-time from high-speed athletic movements.
- [x] **Build Skeleton Tracking Workflows**
  - Developed real-time skeleton overlay rendering (distinguishable Red joint nodes and Green bone connection lines) processed frame-by-frame and exported as native HTML5 H.264 streams using `imageio` and `FFMPEG`.
- [x] **Develop Biomechanical Analysis Modules**
  - Implemented mathematical models to calculate dynamic range of motion (ROM) and postural metrics including:
    - **Knee Valgus**: Lateral knee deviation ratio relative to hips.
    - **Hip Stability**: Pelvic drop and tilt angles.
    - **Trunk Lean**: Forward and lateral spinal posture tilt.
    - **Landing Mechanics, Stride Length, and Balance Drift**.
- [x] **Create Movement Quality Assessment**
  - Added user questionnaire alignment to dynamically adjust risk evaluation thresholds based on specific sport loads (e.g., Soccer agility vs. Basketball jumping impact).
- [x] **Generate Biomechanics Reports**
  - Saved completed kinematic analysis runs dynamically in the MongoDB `video_analyses` collections, serving structured metrics directly to the athlete, coach, and physiotherapist dashboards.

---

## 🚀 Key Outcomes Achieved
1. **Pose Estimation Engine Operational**: Real-time multi-joint kinematic extraction runs under 2–3 seconds on the FastAPI backend due to optimized frame downsampling.
2. **Biomechanical Analysis Workflows Functional**: Standardized mathematical formulas calculate anatomical angles dynamically.
3. **Movement Assessment System Completed**: Highly interactive UI displays red/green skeletal video tracking feeds alongside progress metrics, risk gauges, and anatomical diagnostics.
