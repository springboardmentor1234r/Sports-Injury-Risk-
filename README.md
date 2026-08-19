# Vantage — Sports Injury Risk Detection from Video

Vantage is an AI-assisted platform that analyzes athlete movement videos to evaluate biomechanics, track training and injury history, and generate an explainable injury risk score.

It is designed for coaches, physiotherapists, sports scientists, and athletes to support better training and injury prevention decisions.

> **Status:** Milestones 1–3 completed and tested. This system is not clinically validated and should be used only as a support tool.

---

## Tech Stack

* **Backend:** Python, FastAPI, SQLAlchemy, Alembic
* **Database:** PostgreSQL
* **Authentication:** JWT (email & password)
* **Computer Vision:** MediaPipe Pose, OpenCV
* **Video Processing:** FFmpeg (via imageio-ffmpeg)
* **Frontend:** React (Vite), Tailwind CSS, Recharts
* **Testing:** Pytest, Vitest

---

## Features Overview

### 🔹 Milestone 1 — User Management & Athlete Records

* Role-based access system (Athlete, Coach, Physiotherapist, Sports Scientist, Admin)
* Athlete profiles with structured data
* Logs for:

  * Injury records
  * Performance metrics
  * Physical assessments
  * Training load

---

### 🔹 Milestone 2 — Video Analysis & Biomechanics

* Upload movement videos for analysis
* Pose estimation using MediaPipe (33 keypoints)
* Generates:

  * Joint angles (knee, hip, elbow)
  * Trunk lean
  * Range of motion
  * Left/right symmetry (LSI)
* Outputs processed video with skeleton overlay

---

### 🔹 Milestone 3 — Injury Risk Scoring

* Generates a **0–100 risk score** based on:

  * Biomechanical deviations
  * Movement asymmetry
  * Injury history
  * Training load (ACWR)
  * Fatigue trends

* Provides **explainable results** with factor breakdown

* Missing data is handled transparently (not assumed)

---

## Project Structure

```
backend/
  app/
    models.py
    schemas.py
    routers/
    services/
  alembic/
  tests/

frontend/
  src/
    pages/
    components/
    __tests__/
```

---

## Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

* Frontend: http://localhost:5173
* API Docs: http://127.0.0.1:8000/docs

---

## Testing

```bash
pytest tests/ -v
cd frontend
npm test
```

---

## Known Limitations

* Not clinically validated
* No sport-specific or age-specific calibration
* Knee valgus accuracy depends on camera angle
* No team-based access control yet
* Uses local storage and basic background processing

---

## Roadmap

* Analytics dashboard
* End-to-end testing
* Scalable deployment
* Improved data-driven risk modeling

---

## Disclaimer

This system is intended as a **decision-support tool only** and should not be used as a medical diagnostic system.
