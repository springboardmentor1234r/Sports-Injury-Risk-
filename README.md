# 🏃 Sports Injury Risk Detection from Video

## 📌 Project Overview

Sports Injury Risk Detection from Video is an AI-powered web application that analyzes athletes' movement from uploaded videos to identify biomechanical issues and predict potential injury risks.

The system uses Computer Vision and Pose Estimation techniques to extract body keypoints, analyze movement patterns, and provide injury risk assessments along with corrective recommendations.

This project is being developed as part of the **Infosys Internship**.

---

# 🎯 Project Objectives

- Detect human body pose from sports videos.
- Analyze athlete biomechanics.
- Predict injury risks using AI.
- Provide corrective exercise recommendations.
- Monitor athlete performance over time.

---

# 🚀 Features

## ✅ Module 1: Authentication & Role-Based Access

- User Registration
- User Login
- JWT Authentication
- Role-Based Authorization
- Administrator
- Athlete
- Coach
- Physiotherapist
- Sports Scientist

---

## ✅ Module 2: Athlete Profile Management

- Athlete Registration
- Athlete Information
- Injury History
- Training Load
- Performance Score
- Physical Assessment
- Athlete CRUD Operations

---

## ✅ Module 3: Video Upload & Processing

- Upload Sports Videos
- Video Metadata Extraction
- Video Quality Validation
- Frame Extraction
- Video Preprocessing
- Brightness Enhancement
- Contrast Enhancement
- Noise Reduction

---

## 🚧 Module 4: Pose Estimation Engine (In Progress)

- Human Pose Detection
- Skeleton Generation
- Keypoint Extraction
- Joint Tracking
- Motion Trajectory Analysis

---

# 🛠️ Technology Stack

### Backend

- FastAPI
- Python
- SQLAlchemy
- PostgreSQL
- JWT Authentication
- OAuth2

### Computer Vision

- OpenCV
- MediaPipe Pose (Upcoming)

### Database

- PostgreSQL

---

# 📂 Project Structure

```
Sports-Injury-Risk-Detection
│
├── backend
│   ├── app
│   │   ├── api
│   │   ├── crud
│   │   ├── models
│   │   ├── schemas
│   │   ├── services
│   │   ├── dependencies
│   │   └── core
│   │
│   ├── uploads
│   ├── frames
│   ├── processed_frames
│   └── main.py
│
├── docs
│
└── README.md
```

---

# ⚙️ Installation

Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/Sports-Injury-Risk-Detection.git
```

Go to the project folder

```bash
cd Sports-Injury-Risk-Detection
```

Create a virtual environment

```bash
python -m venv .venv
```

Activate it

### Windows

```bash
.venv\Scripts\activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

Run the server

```bash
uvicorn app.main:app --reload
```

Open Swagger API

```
http://127.0.0.1:8000/docs
```

---

# 📊 Current Progress

| Module | Status |
|---------|--------|
| Authentication | ✅ Completed |
| Athlete Profile Management | ✅ Completed |
| Video Upload | ✅ Completed |
| Video Processing | ✅ Completed |
| Pose Estimation | 🚧 In Progress |
| Biomechanical Analysis | ⏳ Pending |
| Injury Prediction | ⏳ Pending |
| Dashboard | ⏳ Pending |

---

# 📅 Project Roadmap

- ✅ Authentication
- ✅ Athlete Management
- ✅ Video Processing
- 🔄 Pose Estimation
- ⏳ Biomechanical Analysis
- ⏳ Injury Risk Prediction
- ⏳ Recommendation Engine
- ⏳ Dashboard & Analytics
- ⏳ Deployment

---

# 👩‍💻 Developed By

**Anjali Rathi**

Infosys Internship Project

Sports Injury Risk Detection from Video

---

# 📜 License

This project is developed for educational and internship purposes.