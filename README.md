# Sports Injury Risk Detection from Video

## Project Overview

Sports Injury Risk Detection from Video is a computer vision application developed to analyze an athlete's movement using pose estimation techniques. The system processes uploaded videos, detects human body landmarks, calculates important joint angles, evaluates movement quality, estimates injury risk, and generates an analysis report.

The project is built using FastAPI for the backend, OpenCV for video processing, and MediaPipe Pose for human pose estimation.

---

## Objectives

- Analyze athlete movements from uploaded videos.
- Detect human body landmarks using pose estimation.
- Calculate biomechanical joint angles.
- Assess movement quality using rule-based analysis.
- Estimate injury risk based on joint angle thresholds.
- Generate processed videos and structured analysis reports.

---

## Features

- User authentication
- Athlete management
- Video upload API
- Video processing using OpenCV
- Human pose detection using MediaPipe
- Joint angle calculation
- Average joint angle computation
- Movement quality analysis
- Injury risk assessment
- Processed video generation
- JSON report generation

---

## Technology Stack

### Backend

- Python 3.11
- FastAPI
- Uvicorn

### Computer Vision

- OpenCV
- MediaPipe Pose

### Utilities

- NumPy
- JSON
- Git
- GitHub

---

## Project Structure

```
Sports-Injury-Risk-/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   │
│   ├── routes/
│   │   ├── auth_routes.py
│   │   ├── athlete_routes.py
│   │   └── video_routes.py
│   │
│   ├── services/
│   │   ├── pose_service.py
│   │   ├── angle_service.py
│   │   ├── risk_service.py
│   │   └── report_service.py
│   │
│   ├── models/
│   │   └── athlete.py
│   │
│   ├── uploads/
│   │
│   └── utils/
│
├── README.md
└── LICENSE
```

---

## System Workflow

```
Video Upload
      │
      ▼
OpenCV Video Processing
      │
      ▼
MediaPipe Pose Detection
      │
      ▼
Joint Angle Calculation
      │
      ▼
Movement Analysis
      │
      ▼
Injury Risk Assessment
      │
      ▼
JSON Report Generation
```

---

## Installation

### Clone the Repository

```bash
git clone https://github.com/springboardmentor1234r/Sports-Injury-Risk-.git
```

### Navigate to the Project

```bash
cd Sports-Injury-Risk-/backend
```

### Create a Conda Environment

```bash
conda create -n sports-injury python=3.11
```

### Activate the Environment

```bash
conda activate sports-injury
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run the Application

```bash
python -m uvicorn main:app --reload
```

Open the API documentation:

```
http://127.0.0.1:8000/docs
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/register` | Register a new user |
| POST | `/login` | User authentication |

### Athlete Management

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/athletes` | Retrieve athletes |
| POST | `/athletes` | Add a new athlete |

### Video Analysis

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/upload-video` | Upload and analyze a video |

---

## Processing Pipeline

The uploaded video passes through the following stages:

1. Upload video.
2. Read video using OpenCV.
3. Detect human pose landmarks using MediaPipe.
4. Calculate elbow, knee, and hip joint angles.
5. Compute average joint angles across the video.
6. Analyze movement quality.
7. Estimate injury risk.
8. Generate a processed video with pose annotations.
9. Generate a JSON analysis report.

---

## Sample API Response

```json
{
    "message": "Video uploaded successfully",
    "filename": "person_walking.mp4",
    "processed_video": "uploads/processed_person_walking.mp4",
    "video_info": {
        "width": 768,
        "height": 432,
        "fps": 23.98,
        "total_frames": 164,
        "duration_seconds": 6.84
    },
    "joint_angles": {
        "left_elbow": 169.69,
        "left_knee": 159.29,
        "left_hip": 167.00
    },
    "movement_analysis": "Stable posture detected with acceptable joint alignment.",
    "injury_risk": "Low",
    "report": "uploads/person_walking_report.json"
}
```

---

## Current Capabilities

- Upload athlete videos
- Detect body landmarks
- Calculate joint angles
- Display pose skeleton on processed video
- Overlay joint angles on processed video
- Compute average joint angles
- Perform movement quality analysis
- Estimate injury risk
- Generate JSON reports

---

## Future Enhancements

- Machine Learning–based injury prediction
- Deep learning pose analysis
- Multi-athlete tracking
- Real-time webcam analysis
- Exercise recognition
- Historical performance tracking
- Interactive dashboard
- PDF report generation
- Performance analytics
- Coach and athlete management portal

---

## Developer

**Sejal Chintala**

Bachelor of Technology (Computer Science and Engineering – AIML)

Gandhi Institute of Technology

Infosys Springboard Virtual Internship Project

---

## License

This project has been developed for educational purposes as part of the Infosys Springboard Virtual Internship.