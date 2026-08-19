# Athlete Performance Hub

> **AI-Assisted Athlete Performance, Biomechanical Analysis & Injury Risk Assessment Platform**


## Project Overview

The **Athlete Performance Hub** is a full-stack sports-performance platform designed to combine athlete profiles, training workload, injury history, video-based movement analysis, biomechanical metrics, and explainable athlete intelligence into a unified web application.

The platform processes athlete training videos using **MediaPipe Pose Landmarker and OpenCV**, extracts skeletal landmarks, calculates movement metrics such as knee angles and bilateral symmetry, and combines these measurements with training-load and injury-history information to generate understandable risk indicators and training recommendations.

The system is designed to support **athletes, coaches, physiotherapists, sports-performance staff, and administrators** in reviewing movement quality and athlete performance.

> **Disclaimer:** Athlete Performance Hub is a sports-performance decision-support system. Risk scores and recommendations are analytical outputs and should not be treated as medical diagnoses or as a replacement for assessment by a qualified healthcare professional.


# Project Resources & Deliverables

* **Project Presentation:** Athlete Hub M1–M4 Presentation
* **Web Application:** Local Vite development application
* **API Documentation:** FastAPI Swagger / OpenAPI
* **Project Documentation:** `README.md`
* **Deployment Configuration:** `docker-compose.yml`, Dockerfiles and AWS deployment configuration


# Key Capabilities & Features

## 🔐 Secure Authentication & Profile Management

* OAuth2 Password Bearer authentication
* JWT-based access and refresh tokens
* Password hashing
* Account verification workflow
* Forgot-password / recovery workflow
* Protected API endpoints
* Athlete profile management
* Sport and athlete information
* Secure profile-picture upload
* Profile-picture replacement and deletion
* Role-aware application access

---

## 🏋️ Training Workload Management

Athletes can record training activities including:

* Activity type
* Training duration
* RPE (Rate of Perceived Exertion)
* Training date
* Training notes

The platform calculates training workload from recorded sessions.

### Acute-to-Chronic Workload Ratio

The platform provides an ACWR-based workload indicator using recent and historical training workload.

```text
ACWR = Acute Workload / Chronic Workload
```

The implementation compares recent training workload against a longer-term baseline to help identify unusual workload changes.

---

## 🩹 Injury Records & Recovery Tracking

The Injury module allows athlete injury information to be recorded and reviewed.

Information can include:

* Injury date
* Affected body region
* Severity
* Recovery status
* Injury notes
* Recovery updates

Recovery states include:

```text
Active
   ↓
Rehabilitation
   ↓
Recovered
```

The recovery timeline can also contain athlete recovery updates and staff assessment information.

---

# 📹 Biomechanical Video Analysis

The central feature of Athlete Performance Hub is its computer-vision video-analysis pipeline.

An athlete can upload a training video, after which the backend processes the recording frame-by-frame.

### Processing Pipeline

```text
Video Upload
      ↓
Video Storage
      ↓
Frame Extraction
      ↓
MediaPipe Pose Detection
      ↓
33 Body Landmarks
      ↓
Kinematic Calculations
      ↓
Biomechanical Metrics
      ↓
Athlete Intelligence
      ↓
Dashboard + Reports
```

The project presentation describes the same overall architecture from athlete → web application → FastAPI → video processing → MediaPipe → biomechanics → risk/recommendations → dashboard and reports. 

---

# 🧠 Pose Estimation Engine

The platform uses:

* **MediaPipe Pose Landmarker**
* **OpenCV**

The pose-estimation pipeline extracts body landmarks from training footage.

Important tracked body regions include:

* Shoulders
* Elbows
* Wrists
* Hips
* Knees
* Ankles
* Other skeletal landmarks

These landmarks form the foundation for the subsequent biomechanical calculations.

---

# 📐 Biomechanical Analysis

The extracted landmarks are converted into measurable movement information.

## Knee Angle

The system calculates joint angles using vector mathematics.

```text
θ = arccos((u · v) / (|u| × |v|))
```

This allows knee flexion and extension to be tracked throughout a movement.

---

## Bilateral Symmetry

Left and right movement can be compared to identify side-to-side differences.

```text
Symmetry Index =
(1 - |Left Angle - Right Angle|
 / (Left Angle + Right Angle)) × 100
```

---

## Movement Metrics

Depending on the available movement data, the system can evaluate:

* Knee flexion
* Knee extension
* Bilateral symmetry
* Flexion velocity
* Posture alignment
* Movement consistency
* Movement quality

The project's presentation specifically identifies knee angles, bilateral symmetry, posture alignment, flexion velocity and skeletal landmarks as key movement outputs. 

---

# 🎥 Processed Video & Skeleton Overlay

After analysis, the system can generate a processed video containing skeletal overlays.

The overlay allows users to visually inspect:

* Body landmarks
* Skeleton connections
* Movement trajectory
* Joint movement
* Biomechanical analysis

The processed video is stored alongside the original uploaded training video.

---

# 🔄 Video Analysis Progress

The frontend provides a dynamic processing stepper.

```text
✓ Video Uploaded
      ↓
✓ Preparing Analysis
      ↓
● Pose & Biomechanical Analysis
      ↓
○ Intelligence Assessment
      ↓
○ Analysis Complete
```

When processing finishes:

```text
✓ Video Uploaded
✓ Preparing Analysis
✓ Pose & Biomechanical Analysis
✓ Intelligence Assessment
✓ Analysis Complete
```

If processing fails, the interface displays an explicit failure state.

---

# 🔢 Automatic Squat Repetition Counter

The platform includes a movement-specific repetition counter for squat-style exercises.

The system uses knee-angle transitions to determine movement phases.

```text
Standing
   ↓
Flexion
   ↓
Deepest Position
   ↓
Extension
   ↓
Rep Completed
```

The system records:

* Repetition count
* Average repetition depth
* Best repetition depth

The repetition counter is currently **squat-specific** and should not be interpreted as a universal exercise counter.

---

# 📊 Analysis Confidence

The system calculates pose-detection quality using actual landmark visibility information.

| Detection Rate | Confidence |
| -------------: | ---------- |
|          ≥ 90% | HIGH       |
|       70–89.9% | MEDIUM     |
|          < 70% | LOW        |

The confidence indicator describes **pose-detection quality**, not medical certainty.

---

# 🧠 Athlete Intelligence System

The Athlete Intelligence layer combines multiple athlete information sources.

```text
Biomechanical Data
       +
Movement Symmetry
       +
Training Load
       +
Injury History
       +
Fatigue Indicators
       ↓
Athlete Intelligence
       ↓
Risk Indicators
       +
Anomalies
       +
Recommendations
```

The M1–M4 presentation identifies the completed intelligence layer as including risk scoring, anomaly detection, injury-risk indicators and recommendations. 

---

# ⚠️ Weighted Risk Scoring

The current analytical scoring model uses five major factors:

| Risk Factor               |   Weight |
| ------------------------- | -------: |
| Biomechanical Deviations  |      35% |
| Historical Injury Factors |      20% |
| Movement Asymmetry        |      20% |
| Training-Load Indicators  |      15% |
| Fatigue Indicators        |      10% |
| **Total**                 | **100%** |

The weighted model is explicitly documented in the project's specification. 

The resulting score is presented as an **analytical risk indicator** rather than a clinically validated injury probability.

---

# 🔎 Movement Anomaly Detection

The intelligence layer can identify movement-related anomalies such as:

* Movement deviations
* Technique inconsistencies
* Motion inconsistency
* Fatigue-related movement changes
* Performance decline
* Balance deviations
* Joint instability
* Abnormal posture

Anomalies can be displayed with severity and supporting information.

---

# 💡 Explainable Recommendations

Instead of presenting only a numerical risk score, the system provides understandable recommendations based on detected factors.

Possible recommendation categories include:

* Mobility exercises
* Strengthening exercises
* Recovery planning
* Training modifications
* Warm-up improvements
* Cool-down improvements
* Flexibility work

Recommendations are intended to support training decisions and discussion with qualified professionals.

---

# 👤 Athlete Profile

Each athlete can maintain a personal profile containing information such as:

* Name
* Sport
* Position
* Height
* Weight
* Biography
* Injury history
* Training information
* Profile picture

Profile pictures support:

```text
.jpg
.jpeg
.png
.webp
```

Uploaded images are validated and stored using generated filenames to reduce filename collisions and path-related risks.

---

# 📹 Video Vault

The **Video Vault** provides a centralized archive of athlete training videos.

Users can:

* Upload training videos
* View uploaded videos
* Play processed videos
* Start analysis
* View analysis status
* Review analysis scores
* Delete videos according to permissions
* Refresh the archive

The project documentation also specifies deletion of the associated database record, uploaded MP4 and processed analysis files when a video is removed. 

---

# 📄 Reports & Export

The platform provides athlete performance reporting.

Reports can include:

* Athlete profile
* Training timeline
* Injury records
* Biomechanical metrics
* Risk assessment
* Movement information
* Athlete intelligence results

Export functionality includes:

* CSV data export
* Printable HTML report
* PDF-compatible report workflow

---

# 🌐 Public Landing Page

The application includes a public landing page before authentication.

The landing page presents:

* Athlete Hub branding
* Platform overview
* Movement analysis
* Injury-risk indicators
* Training-load monitoring
* Athlete intelligence
* Reports
* Technology stack
* How the platform works

A custom SVG biomechanical visualization is used to demonstrate skeletal tracking.

Unauthenticated users can navigate to `/login`.

Authenticated users are directed to the dashboard.

---

# 👥 Platform Roles

The platform architecture supports role-aware functionality for users such as:

### Athlete

* Personal dashboard
* Training logs
* Injury records
* Video analysis
* Risk indicators
* Recommendations
* Recovery information

### Coach

* Athlete performance monitoring
* Training information
* Video analysis
* Risk indicators
* Recommendations

### Physiotherapist

* Injury history
* Recovery tracking
* Movement analysis
* Risk information
* Rehabilitation-related observations

### Administrator

* Platform administration
* User management
* System-level functionality

---

# 🏗️ System Architecture

```text
                    ATHLETE
                       │
                       ▼
              React + Vite Frontend
                       │
                       ▼
                 Axios / REST
                       │
                       ▼
              FastAPI Backend
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
     Authentication  Training    Injury Data
          │            │            │
          └────────────┼────────────┘
                       │
                       ▼
                 Video Pipeline
                       │
                       ▼
              MediaPipe Pose
                       │
                       ▼
                    OpenCV
                       │
                       ▼
            Biomechanical Analytics
                       │
                       ▼
             Athlete Intelligence
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Risk        Anomalies    Recommendations
          │            │            │
          └────────────┼────────────┘
                       ▼
              Dashboard + Reports
```

---

# 🛠️ Technology Stack

## Frontend

* React
* Vite
* React Router
* Axios
* JavaScript / JSX
* CSS
* Responsive UI
* Glassmorphism UI

## Backend

* Python
* FastAPI
* Uvicorn
* SQLAlchemy
* Pydantic
* OAuth2
* JWT
* bcrypt

## Computer Vision

* MediaPipe Pose Landmarker
* OpenCV

## Database

### Development

* SQLite

### Deployment Compatibility

* PostgreSQL

The project's architecture documentation explicitly identifies React + Vite, FastAPI + SQLAlchemy, MediaPipe + OpenCV, and SQLite/PostgreSQL support. 

## Deployment

* Docker
* Docker Compose
* Nginx
* AWS deployment configuration

---

# 📁 Repository Directory Structure

```text
Athlete_Performance_Hub/
│
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── admin.py
│   │   │   ├── athlete.py
│   │   │   ├── auth.py
│   │   │   ├── dataset.py
│   │   │   ├── injury.py
│   │   │   ├── report.py
│   │   │   ├── training.py
│   │   │   └── video.py
│   │   │
│   │   ├── services/
│   │   │   ├── analytics.py
│   │   │   ├── pose_estimator.py
│   │   │   └── report_generator.py
│   │   │
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── schemas.py
│   │
│   ├── uploads/
│   ├── athlete_hub.db
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Datasets.jsx
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginRegister.jsx
│   │   │   └── VideoUpload.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   └── index.css
│   │
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml
├── deploy_aws.md
├── verify_hub.py
└── README.md
```

The documented workspace uses one primary `backend` and one primary `frontend` rather than the obsolete nested frontend structure. 

---

# 🚀 Quickstart & Setup Guide

## 1. Prerequisites

### Backend

* Python 3.10+
* pip
* Virtual environment

### Frontend

* Node.js 18+
* npm

### Optional

* Docker
* PostgreSQL

---

# 2. Backend Installation

Navigate to the backend:

```powershell
cd "C:\Users\neela\OneDrive\Documents\code\backend"
```

Create the virtual environment:

```powershell
python -m venv .venv
```

Install dependencies:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Start FastAPI:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

> Using `.venv\Scripts\python.exe` avoids PowerShell execution-policy problems when virtual-environment activation is blocked.

---

# 3. Frontend Installation

Open a second terminal:

```powershell
cd "C:\Users\neela\OneDrive\Documents\code\frontend"
```

Install dependencies:

```powershell
npm install
```

Start Vite:

```powershell
npm.cmd run dev
```

Application:

```text
http://localhost:5173
```

---

# 4. Running Both Services

You need **two terminals**.

### Terminal 1 — Backend

```powershell
cd "C:\Users\neela\OneDrive\Documents\code\backend"

.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

### Terminal 2 — Frontend

```powershell
cd "C:\Users\neela\OneDrive\Documents\code\frontend"

npm.cmd run dev
```

Then open:

```text
http://localhost:5173
```

---

# 🧪 Automated Testing

Run the integration verification suite:

```powershell
cd "C:\Users\neela\OneDrive\Documents\code\backend"

python verify_hub.py
```

The project's documented verification run reported successful integration/authentication tests. 

---

# 🏗️ Frontend Production Build

```powershell
cd "C:\Users\neela\OneDrive\Documents\code\frontend"

npm run build
```

A successful build confirms that the React/Vite frontend can be compiled for production.

---

# 🐳 Docker Deployment

Verify Docker Compose:

```powershell
docker compose config
```

Build and start:

```powershell
docker compose up --build
```

For production deployments, configure secrets through environment variables rather than committing them into source control.

---

# 🔒 Security

The platform implements:

* JWT authentication
* OAuth2 bearer authentication
* Password hashing
* Protected endpoints
* Role-aware authorization
* Profile image validation
* File-size restrictions
* Generated upload filenames
* File cleanup
* Authenticated report access

Production deployments should additionally configure HTTPS, secure secrets, restricted CORS policies, and appropriate database permissions.

---

# ⚠️ Current Limitations

### Exercise Support

The current repetition counter is primarily tuned for squat-style movement.

Other exercises require movement-specific analysis logic.

### Video Quality

Pose-analysis quality can be affected by:

* Poor lighting
* Occlusion
* Camera angle
* Low resolution
* Fast movement
* Multiple people in the frame

### Medical Interpretation

Risk indicators and recommendations are analytical outputs.

They are **not clinical diagnoses** and should be reviewed by qualified professionals when used for rehabilitation or injury-related decisions.

### Video Encoding

Processed-video playback may depend on the required H.264/OpenH264 components being available in the local environment.

---

# 🔮 Future Scope

Possible future improvements include:

* Exercise-specific pose-analysis models
* Running and jumping analysis
* Landing-mechanics analysis
* Multi-camera movement analysis
* Advanced rehabilitation workflows
* Athlete-to-athlete comparison
* Long-term performance trends
* Automated recovery reminders
* Mobile application
* Cloud-based video processing
* Larger validated sports-performance datasets
* More advanced machine-learning models
* Team-level analytics
* Real-time camera analysis

---

# 📈 Project Development

The platform evolved through four primary milestones:

```text
M1
Authentication + Athlete Profiles
             ↓
M2
Training Load + Injury Management
             ↓
M3
Video + Pose + Biomechanical Analysis
             ↓
M4
Athlete Intelligence + Risk + Recommendations
             ↓
Enhancements
Rep Counter + Confidence + Recovery +
Profile Pictures + Reports + Landing Page
```

The presentation describes M1 as the foundation, M2 as the video pipeline, M3 as pose/biomechanics, and M4 as the intelligence layer. 

---

# 📜 Disclaimer

Athlete Performance Hub is an academic/software engineering project intended for sports-performance analysis and decision support.

The system's:

* Risk scores
* Biomechanical metrics
* Anomaly indicators
* Training recommendations
* Recovery information

should not be interpreted as medical diagnosis, treatment, or guaranteed prediction of injury.

Professional medical or physiotherapy assessment should always be used for clinical decisions.
