# 🏆 SportSense AI – Sports Injury Risk Detection System

## 📖 Project Overview

SportSense AI is an AI-powered Sports Injury Risk Detection platform that analyzes athlete movement videos using Computer Vision and Artificial Intelligence to identify biomechanical deviations, assess injury risks, and generate detailed performance reports.

The platform assists athletes, coaches, physiotherapists, and sports scientists in preventing injuries through movement analysis and data-driven recommendations.

---

# 🎯 Objectives

- AI-based athlete pose estimation
- Joint angle analysis
- Biomechanical assessment
- Injury risk prediction
- Athlete performance analytics
- PDF report generation
- Secure authentication
- Dashboard visualization

---

# ✅ Milestone 1 (Completed)

- User Registration
- JWT Authentication
- Login System
- Role-Based Access
- Athlete Profile Management
- PostgreSQL Integration
- FastAPI Backend
- React Frontend
- Landing Page
- Protected Routes
- Dashboard
- Swagger API

---

# ✅ Milestone 2 (Completed)

- Video Upload
- OpenCV Video Processing
- MediaPipe Pose Estimation
- Skeleton Tracking
- Joint Angle Calculation
- Biomechanical Analysis
- Range of Motion Analysis
- Symmetry Analysis
- Hip Stability Analysis
- Balance Score
- Movement Quality Score
- Injury Risk Prediction
- Processed Video Generation
- PDF Report Generation
- Athlete History
- Dashboard Analytics

---

# 🛠 Tech Stack

## Frontend

- React.js
- Vite
- Tailwind CSS
- React Router
- Axios
- Framer Motion
- Lucide React

## Backend

- FastAPI
- SQLAlchemy
- JWT Authentication
- Passlib
- Uvicorn
- OpenCV
- MediaPipe
- ReportLab

## Database

- PostgreSQL

---

# 📂 Project Structure

```text
Sports-Injury-Risk-Detection/

├── backend/
│
├── frontend/
│
├── milestone-1/
│
├── milestone-2/
│
└── README.md
```

---

# Backend Setup

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Backend

```
http://127.0.0.1:8000
```

Swagger

```
http://127.0.0.1:8000/docs
```

---

# Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend

```
http://localhost:5173
```

---

# Current Workflow

```
Landing Page
      │
      ▼
Register/Login
      │
      ▼
JWT Authentication
      │
      ▼
Dashboard
      │
      ▼
Upload Sports Video
      │
      ▼
OpenCV Processing
      │
      ▼
MediaPipe Pose Detection
      │
      ▼
Joint Angle Calculation
      │
      ▼
Biomechanical Analysis
      │
      ▼
Risk Prediction
      │
      ▼
Processed Video
      │
      ▼
PDF Report
      │
      ▼
Dashboard & History
```

---

# 🚀 Future Enhancements

- YOLOv8 Pose Detection
- TensorFlow Injury Prediction Model
- XGBoost Risk Classification
- Multi-Sport Support
- Coach Dashboard
- Physiotherapist Dashboard
- Sports Scientist Dashboard
- Real-Time Live Camera Analysis
- Docker Deployment
- AWS Cloud Deployment

---

# 👨‍💻 Project

**SportSense AI – Sports Injury Risk Detection System**

AI/ML Final Year Project

---

# 📄 License

Developed for academic and educational purposes.