# Sports Injury Risk Detection (SIRD) System

> Biomechanical Motion Analysis & Real-Time Injury Risk Prevention Platform

---

## Project Overview

The **Sports Injury Risk Detection (SIRD) System** is a computer vision and machine learning platform designed to assess athlete movement mechanics, detect biomechanical anomalies, and provide personalized clinical rehabilitation prescriptions in real time.

By processing video files or live camera feeds, the platform extracts 33 3D body keypoints via MediaPipe Pose Landmarking, evaluates joint angles (*knee valgus, trunk lean, landing stiffness, movement asymmetry*), predicts 6 distinct injury risks using trained Random Forest Machine Learning Ensembles, and generates autonomous corrective exercise routines via a Generative AI Recommendation Agent (powered by Google Gemini AI).

---

## Project Resources & Deliverables

* **Presentation Deck (PPT/Google Slides)**: [Google Slides Presentation](https://docs.google.com/presentation/d/1Vdl5OxlwBjciJFDXsEp4jr8VneLUIKoq/edit?usp=sharing&ouid=115952871947388189662&rtpof=true&sd=true)
* **Live Web Application (Production)**: [sird.netlify.app](https://sird.netlify.app/)
* **Full Project Documentation (PDF)**: [Insert Google Drive Documentation Link Here](https://drive.google.com/your-pdf-link-here)

---

## Key Capabilities & Features

* **Real-Time Live Motion Capture Modal**:
  * Live camera viewfinder displaying real-time posture tracking on an HTML5 Canvas.
  * Overlays red joint nodes (*Shoulders, Elbows, Wrists, Hips, Knees, Ankles*) connected by yellow bone lines.
  * Records live motion events and automatically submits clips for full MediaPipe + ML analysis.

* **Multi-Model Machine Learning Ensemble**:
  * 6 specialized Random Forest classifiers trained to predict specific injury risks: ACL Strain, Hamstring Tear, Ankle Sprain, Shoulder Impingement, Lower Back Stress, and Overuse Fatigue.
  * **IsolationForest Anomaly Engine**: Identifies severe movement form collapse.

* **5-Factor Weighted Risk Scoring Model**:
  $$\text{Injury Risk Score} = 35\% (\text{Biomechanics}) + 20\% (\text{History}) + 20\% (\text{Asymmetry}) + 15\% (\text{Training Load}) + 10\% (\text{Fatigue})$$

* **Autonomous Generative AI Recommendation Agent**:
  * Integrated Generative AI Agent powered by Google Gemini API (`gemini-3.7-flash-video-understanding-eap` / `gemini-2.5-computer-use-preview`).
  * Autonomously generates personalized clinical exercise prescriptions based on an athlete's 3D keypoints, sport, position, and ML risk scores.
  * Includes a local Kinematic AI Expert System fallback mechanism.

* **Dynamic Explainable AI (XAI) Rationale**:
  * Provides natural language feature attribution explaining why a specific risk score was predicted (e.g., *"Driven by dynamic knee valgus of 14.2° and stiff ground landing at 28.5° knee flexion"*).

* **Multi-Role Tailored Workspaces**:
  * **Athlete**: Personal risk scores, 3D radar charts, body heatmap, AI exercise routines, subjective recovery logs.
  * **Coach & Physiotherapist**: Roster risk triage tables, patient movement correction analytics, custom prescription modal.
  * **Sports Scientist**: Team performance trends, joint angle distribution histograms, ML model validation accuracy metrics, anonymized cohort research data exports.
  * **Administrator**: User role management, real-time server throughput, latency, and database health metrics.

* **Automated Export System**:
  * 1-click formatted PDF Medical Summary Reports and CSV Telemetry Data Exports with query token authorization.

---

## Repository Directory Structure

```text
Sports_Injury_Risk_Detection_From_Video/
├── milestone4/                         # Active Production Milestone
│   ├── backend/                        # FastAPI REST API Server
│   │   ├── app/
│   │   │   ├── auth.py                 # JWT & OAuth2 Authentication
│   │   │   ├── config.py               # Settings & Environment Variables
│   │   │   ├── database.py             # MongoDB Atlas Motor Async Connection
│   │   │   ├── schemas.py              # Pydantic Request/Response Models
│   │   │   ├── engines/
│   │   │   │   ├── ai_recommendation_agent.py   # Gemini Generative AI Agent
│   │   │   │   ├── anomaly_detection_engine.py  # IsolationForest Anomaly Engine
│   │   │   │   ├── ml_prediction_engine.py      # 6 Random Forest Classifiers + XAI
│   │   │   │   └── risk_scoring_engine.py       # 5-Factor Weighted Risk Scoring
│   │   │   ├── routes/                 # REST Route Modules
│   │   │   │   ├── auth_routes.py
│   │   │   │   ├── notification_routes.py
│   │   │   │   ├── recommendation_routes.py
│   │   │   │   ├── report_routes.py
│   │   │   │   ├── system_routes.py
│   │   │   │   └── video_routes.py
│   │   │   └── seed_12_athletes.py     # 12 Athlete Demo Data Seeding Script
│   │   ├── tests/
│   │   │   └── test_api_suite.py       # Pytest Automated Test Suite
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   └── frontend/                       # Vite + React Modern Web Application
│       ├── src/
│       │   ├── components/
│       │   │   ├── BiomechanicalCharts.jsx # Canvas Radar & Heatmap Charts
│       │   │   ├── CustomRecModal.jsx      # Practitioner Prescription Modal
│       │   │   ├── LiveCameraModal.jsx     # Live Skeletal Tracking Modal
│       │   │   └── NotificationBell.jsx    # Topbar Alert Drawer
│       │   ├── pages/
│       │   │   ├── Dashboard.jsx           # Unified Multi-Role Dashboard
│       │   │   └── Login.jsx               # Auth & Demo Logins
│       │   ├── App.jsx
│       │   └── index.css                   # Modern Glassmorphic CSS Theme
│       ├── package.json
│       └── vite.config.js
│
├── .gitignore                          # Git Ignore Rules
└── README.md                           # Main Project Documentation
```

---

## Quickstart & Setup Guide

### 1. Prerequisites
* **Python**: `3.11+`
* **Node.js**: `18.0+`
* **MongoDB**: Atlas Cluster URI or Local MongoDB instance

### 2. Backend Installation & Configuration

```bash
# Navigate to milestone4 backend
cd milestone4/backend

# Install Python dependencies
pip install -r requirements.txt
```

Create a `.env` file inside `milestone4/backend/`:

```env
MONGODB_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/sports_injury
JWT_SECRET_KEY=your_jwt_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here

PORT=8000
HOST=127.0.0.1
```

### 3. Seed Demo Roster (12 Processed Athletes)

Run the seeding script to populate 12 realistic athlete profiles and execute full ML predictions:

```bash
python app/seed_12_athletes.py
```

### 4. Start Server Applications

#### Launch Backend Server:
```bash
python -m uvicorn app.main:app --reload --port 8000
```
* API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
* Diagnostic Test: [http://localhost:8000/api/system/test-gemini](http://localhost:8000/api/system/test-gemini)

#### Launch Frontend Application:
```bash
cd ../frontend
npm install
npm run dev
```
* Web Application: [http://localhost:5173](http://localhost:5173)

---

## Automated Testing

Execute the backend Pytest test suite:

```bash
cd milestone4/backend
pytest
```
* Expected Result: **5/5 Passed (100% Pass Rate)**

---

## Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Athlete** | `marcus.rashford@sird.com` | `password123` |
| **Coach** | `coach.alex@sird.com` | `password123` |
| **Physiotherapist** | `physio.john@sird.com` | `password123` |
| **Sports Scientist** | `scientist.newton@sird.com` | `password123` |
| **Administrator** | `admin@sird.com` | `admin123` |
