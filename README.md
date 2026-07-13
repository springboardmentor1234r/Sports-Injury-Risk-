# 🏆 SportSense AI – Sports Injury Risk Detection System

## 📖 Project Overview

SportSense AI is an AI-powered Sports Injury Risk Detection platform designed to help athletes, coaches, and trainers identify potential injury risks before they become serious.

The system combines Computer Vision, Pose Estimation, Machine Learning, and Biomechanical Analysis to analyze sports videos and provide injury risk predictions along with actionable recommendations.

---

## 🎯 Project Objectives

- Detect athlete body posture using AI
- Analyze movement biomechanics
- Predict potential injury risks
- Assist athletes in improving performance safely
- Generate AI-powered analysis reports

---

## 🚀 Milestone 1 Features

- ✅ User Registration
- ✅ User Login (JWT Authentication)
- ✅ Protected Authentication APIs
- ✅ Modern React Landing Page
- ✅ Responsive Dashboard
- ✅ Video Upload Interface
- ✅ FastAPI Backend
- ✅ PostgreSQL Database Integration
- ✅ Swagger API Documentation

---

## 🛠 Tech Stack

### Frontend

- React.js
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- Framer Motion
- Lucide React

### Backend

- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT Authentication
- Passlib
- Uvicorn

### Database

- PostgreSQL

---

## 📂 Project Structure

```text
Sports-Injury-Risk-Detection/

├── backend/
│   ├── app/
│   │   ├── database/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── utils/
│   │   └── main.py
│   ├── uploads/
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## ⚙️ Backend Setup

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Backend:

```
http://127.0.0.1:8000
```

Swagger:

```
http://127.0.0.1:8000/docs
```

---

## ⚙️ Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend:

```
http://localhost:5173
```

---

## 📊 Current Workflow

```text
Landing Page
      │
      ▼
Register
      │
      ▼
Login (JWT)
      │
      ▼
Dashboard
      │
      ▼
Upload Video
      │
      ▼
FastAPI Backend
      │
      ▼
PostgreSQL Database
```

---

## 🔮 Upcoming Milestones

- MediaPipe Pose Estimation
- OpenCV Video Processing
- Skeleton Detection
- Joint Angle Analysis
- Injury Risk Prediction
- AI Report Generation
- Performance Analytics
- Multi-Sport Support

---

## 👨‍💻 Project

**SportSense AI – Sports Injury Risk Detection System**

AI/ML Final Year Project

---

## 📄 License

Developed for academic and educational purposes.