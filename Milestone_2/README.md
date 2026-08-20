# Milestone 2: Video Ingestion, 33-Keypoint Pose Estimation & Skeleton Tracking

## Overview
Milestone 2 provides the core computer vision ingestion pipeline, temporal frame extraction, 33-anatomical-landmark pose detection using MediaPipe, 2D/3D skeleton wireframe tracking, and real-time joint kinematic telemetry.

## Key Features
- **Video Upload & Lifecycle**: MP4/MOV ingestion with format validation, preview player, and safe deletion with filesystem cleanup.
- **MediaPipe Pose Extraction**: Extracts 33 3D spatial anatomical coordinates per video frame.
- **2D/3D Skeleton Tracking**: Real-time wireframe overlay rendering and motion trail visualization.
- **Joint Kinematic Telemetry**: Live frame-by-frame joint angle calculation (Knee Valgus, Hip Flexion, Spine Alignment, Ankle Dorsiflexion).
- **Interactive UI**: Video upload manager, skeleton visualizer, frame navigator, velocity graphs, and angle heatmaps.

## Directory Structure
- `backend/`: FastAPI routers (`pose.py`, `analysis.py`, `video.py`), schemas, and models.
- `frontend/`: React components (`PoseCanvas`, `SkeletonViewer`, `VideoUploader`, `JointAngleCard`) and pages (`VideoUpload`, `PoseAnalysis`, `SkeletonTracking`, `Biomechanics`).
- `models/`: Pose and skeleton data models (`pose.py`, `skeleton.py`, `biomechanics.py`, `video.py`).
- `src/`: Computer vision core services and kinematic calculation modules.
- `outputs/`: Telemetry exports and sample tracking data.
- `requirements.txt`: Python dependencies (OpenCV, MediaPipe, NumPy, etc.).
