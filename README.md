#  Sports Injury Risk Detection

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-lightgrey.svg)](#-license)

A modular, milestone-based AI system that analyzes pose estimation data and biomechanical metrics to predict potential sports injuries, detect movement anomalies, assess overall injury risk, and deliver personalized prevention recommendations — served through a secure, role-based FastAPI backend.

---

## 📌 Project Overview

Sports injuries are often preceded by subtle, repeatable movement faults — compensations that are hard to catch with the naked eye but show up clearly in joint kinematics over time. This project builds a pipeline that:

1. Extracts pose landmarks from athlete movement video
2. Converts landmarks into interpretable biomechanical features (joint angles, symmetry, range of motion)
3. Scores injury risk and flags anomalous movement patterns
4. Surfaces everything through a documented, authenticated REST API

The goal is to move from **reactive** injury treatment to **proactive** injury prevention.

---

## 🚀 Features

- 🎥 Pose estimation from video using MediaPipe's PoseLandmarker (Tasks API)
- 📐 Multi-joint biomechanical feature extraction (knees, hips, elbows, shoulders, trunk)
- ⚠️ Injury risk prediction and overall risk scoring
- 🔍 Movement anomaly detection
- 💡 Personalized injury prevention recommendations
- 📄 JSON report generation per athlete/session
- 🔐 JWT authentication with role-based access control (5 roles)
- ⚡ REST API via FastAPI with interactive Swagger docs
- 🗄️ Persistent storage via PostgreSQL + SQLAlchemy

---

## 🧩 Milestone Progress

| Milestone | Scope | Status |
|---|---|---|
| **1 — Foundation** | PostgreSQL setup, SQLAlchemy models, JWT auth, RBAC routers | ✅ Complete |
| **2 — Pose Pipeline** | Video ingestion, landmark extraction, CSV export, skeleton visualization | ✅ Largely complete |
| **3 — Biomechanics & API** | Joint angle calculation, injury prediction, risk scoring, FastAPI exposure | 🔄 In progress |

---

## 📂 Project Structure

```
Sports-Injury-Risk-Detection/
│
├── Milestone_1/
│   ├── auth/                  # JWT auth, RBAC
│   └── models.py              # SQLAlchemy models
│
├── Milestone_2/
│   ├── outputs/                # Extracted landmark CSVs
│   └── videos/                 # Source movement videos
│
├── Milestone_3/
│   ├── backend/
│   │   ├── injury_prediction/
│   │   ├── biomechanics/       # AngleCalculator, feature extraction
│   │   ├── api.py
│   │   ├── main.py
│   │   └── models.py
│   │
│   └── outputs/
│
├── README.md
├── requirements.txt
└── .gitignore
```

---

## ⚙️ Technologies Used

| Category | Tools |
|---|---|
| Language | Python 3.12 |
| API Framework | FastAPI, Uvicorn |
| Pose Estimation | MediaPipe (PoseLandmarker, Tasks API) |
| Computer Vision | OpenCV |
| Data Processing | Pandas, NumPy |
| Validation | Pydantic |
| Database | PostgreSQL, SQLAlchemy, psycopg (v3) |
| Auth | JWT, role-based access control |

---

## 📊 Workflow

```
Video Input
     │
     ▼
Pose Estimation (MediaPipe PoseLandmarker)
     │
     ▼
Biomechanical Feature Extraction (joint angles, symmetry)
     │
     ▼
Injury Prediction
     │
     ▼
Risk Scoring
     │
     ▼
Movement Anomaly Detection
     │
     ▼
Recommendation Engine
     │
     ▼
JSON Reports + FastAPI API (JWT-secured, role-based)
```

---

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd Sports-Injury-Risk-Detection

# Create a virtual environment
python -m venv venv

# Activate the environment (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

Set up PostgreSQL and configure your database connection (see `Milestone_1/` for schema and environment variable setup).

---

## ▶️ Run the Backend

```bash
uvicorn Milestone_3.backend.api:app --reload
```

| Resource | URL |
|---|---|
| Server | http://127.0.0.1:8000 |
| Swagger Docs | http://127.0.0.1:8000/docs |

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth Required |
|---------|----------|-------------|---|
| GET | `/` | API information | No |
| GET | `/health` | Health check | No |
| POST | `/auth/login` | Obtain JWT token | No |
| GET | `/predict` | Injury prediction | Yes |
| GET | `/risk` | Overall risk score | Yes |
| GET | `/anomalies` | Movement anomaly detection | Yes |
| GET | `/recommendations` | Injury prevention recommendations | Yes |
| GET | `/report` | Complete injury analysis report | Yes |

---

## 📁 Generated Outputs

The backend writes JSON reports to:

```
Milestone_3/outputs/
```

Generated files include:
- `prediction.json`
- `risk_report.json`
- `anomalies.json`
- `recommendations.json`

---

## 🎯 Future Improvements

- Real-time webcam pose estimation
- Deep learning-based injury prediction models
- Athlete-facing dashboard
- Historical trend analysis across sessions
- Cloud deployment
- Expanded multi-sport support

---

## 👨‍💻 Author

**Rachit Patnaik**
B.Tech CSE (Data Science)
ITER, Siksha 'O' Anusandhan University
GitHub: [Rachit-Patnaik](https://github.com/Rachit-Patnaik)
