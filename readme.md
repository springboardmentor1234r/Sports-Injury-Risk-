# Sports Injury Risk Detection Platform

AI-powered platform that analyzes athlete movement videos to detect biomechanical issues, assess injury risk, and recommend corrective actions — for athletes, coaches, physiotherapists, sports scientists, and admins.

## Tech Stack

* **Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL, JWT auth
* **CV/ML:** MediaPipe (pose estimation), OpenCV, NumPy
* **Frontend:** React 19 + Vite, React Router, Axios
* **Reports:** ReportLab (PDF), OpenPyXL (Excel)
* **Deployment:** Docker, Docker Compose, Nginx

## Features

* JWT authentication \& role-based access (Athlete, Coach, Physiotherapist, Sports Scientist, Admin)
* Athlete profile \& training/injury history management
* Video upload → pose estimation → joint/keypoint extraction
* Biomechanical analysis (joint angles, symmetry, posture)
* Injury risk scoring (weighted model) \& movement anomaly detection
* Corrective exercise recommendations
* Role-based dashboards (Athlete, Staff, Admin) + team risk overview
* Notifications/alerts and PDF/Excel report export

## Project Structure

```
sports\\\_injury/
├── backend/
│   ├── main.py, auth.py, models.py, schemas.py, database.py
│   ├── routes/      # auth, athlete, video, staff, admin, reports, notifications, settings
│   ├── services/     # pose\\\_estimation, biomechanics, injury\\\_risk, reports, notifications
│   ├── models/        # pose\\\_landmarker\\\_full.task (MediaPipe model)
│   └── tests/
├── frontend/
│   └── src/{pages,components,lib}   # Login, Dashboard, VideoAnalysis, InjuryRiskDashboard,
│                                      StaffDashboard, AdminDashboard, Settings, etc.
├── database/schema.sql
├── docker-compose.yml
└── .env
```

## API Overview

|Prefix|Purpose|
|-|-|
|`/auth`|register, login|
|`/athlete`|profile CRUD|
|`/videos`|upload, pose frames, biomechanics, risk assessment|
|`/staff`|athlete list, team risk overview, analytics|
|`/admin`|user/athlete management, assignments, platform analytics|
|`/reports`|PDF/Excel export (per video, per athlete)|
|`/notifications`|alerts, unread count|
|`/users`|account settings, password, profile picture|

## Setup

### Docker (recommended)

```bash
cp .env              # fill in secrets
docker compose up --build
```

* Frontend: http://localhost:5173
* Backend: http://localhost:8000
* Postgres: localhost:5432

### Manual

**Backend**

```bash
cd backend
pip install -r requirements.txt
cp .env              # set DATABASE\\\_URL, SECRET\\\_KEY
uvicorn main:app --reload
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

## Roles

Athlete · Coach · Physiotherapist · Sports Scientist · Admin

## Status

Milestones 1–4 complete: auth \& profiles, pose/biomechanics engine, injury risk \& recommendations, dashboards + Docker deployment.

