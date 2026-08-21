🏆 Sports Injury Risk Detection System

An AI-based sports movement analysis system that uses computer vision and pose estimation to analyze sports videos and identify potential injury-risk patterns.

📌 Project Overview

The Sports Injury Risk Detection System is designed to analyze an athlete's movement from a video.

The system processes the uploaded video, detects human body landmarks using MediaPipe Pose, analyzes movement patterns and joint positions, and provides a potential injury-risk result along with recommendations and a generated report.

«Note: This project is intended for educational and demonstration purposes. It identifies potential movement-related risk patterns and is not a medical diagnosis system.»

---

🎯 Objectives

- Analyze sports videos to understand athlete movements.
- Detect human body landmarks using MediaPipe Pose.
- Analyze movement patterns and joint angles.
- Identify potential injury-risk factors.
- Provide recommendations based on the analysis.
- Generate a report containing the analysis results.

---

🛠️ Technology Stack

Programming Language

- Python 3.11

Backend

- FastAPI
- Uvicorn

Computer Vision & Pose Estimation

- OpenCV
- MediaPipe Pose

Data Processing

- NumPy
- Pandas

Database

- SQLite
- SQLAlchemy

Frontend

- HTML
- CSS
- JavaScript

Development Tools

- PyCharm
- Git
- GitHub

---

🏗️ System Architecture

The overall workflow of the system is:

User
  │
  ▼
Registration / Login
  │
  ▼
Dashboard
  │
  ▼
Upload Sports Video
  │
  ▼
Video Processing
  │
  ▼
MediaPipe Pose Estimation
  │
  ▼
Movement & Joint Analysis
  │
  ▼
Risk Prediction
  │
  ▼
Recommendations
  │
  ▼
Generated Report

---

🔄 Project Workflow

1. User Registration

A new user can register by providing the required information.

2. User Login

Registered users can log in using their credentials.

3. Dashboard

After successful login, the user can access the main project functionality through the dashboard.

4. Video Upload

The user uploads a sports movement video for analysis.

5. Pose Estimation

The uploaded video is processed frame by frame.

MediaPipe Pose detects important human body landmarks from the video.

6. Movement Analysis

The detected landmarks are used to analyze body movement and joint positions.

The system can use these measurements to identify potentially abnormal or risky movement patterns.

7. Risk Prediction

The analyzed movement information is used to produce a potential injury-risk result.

8. Recommendations

The system provides feedback/recommendations based on the identified movement risk.

9. Report Generation

The analysis results can be presented in a generated report for easier review.

---

🧍 Pose Estimation

MediaPipe Pose is used to detect human body landmarks from sports videos.

The detected landmarks can represent important body parts such as:

- Shoulders
- Elbows
- Wrists
- Hips
- Knees
- Ankles

These landmarks provide the information required for movement analysis.

---

📊 Movement Analysis

The system analyzes the detected body landmarks to understand movement patterns.

The analysis may include:

- Body posture
- Joint positions
- Joint angles
- Movement patterns
- Potentially abnormal movements

The analysis results are then used by the risk-prediction component.

---

⚠️ Risk Prediction

The system evaluates the analyzed movement and produces a potential injury-risk result.

The result is intended to help identify movement patterns that may require attention.

Important: The result should not be considered a medical diagnosis.

---

📄 Generated Reports

The system provides a report containing relevant analysis results.

The report can be used to:

- Review the movement analysis.
- View the identified risk.
- Understand the recommendations.
- Keep a record of the analysis.

---

📁 Project Structure

│
├── backend/
│   ├─�
