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

# 🚀 Milestone 1 Features

✅ User Registration

✅ User Login (JWT Authentication)

✅ Protected Authentication APIs

✅ Modern React Landing Page

✅ Responsive Dashboard

✅ Video Upload Interface

✅ FastAPI Backend

✅ PostgreSQL Database Integration

✅ Swagger API Documentation

---

# 🛠 Tech Stack

## Frontend

- React.js
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- Framer Motion
- Lucide React

## Backend

- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT Authentication
- Passlib (Password Hashing)
- Uvicorn

## Database

- PostgreSQL

---

# 📂 Project Structure

```
Sports-Injury-Risk-Detection/
│
├── backend/
│   ├── app/
│   │   ├── database/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── utils/
│   │   └── main.py
│   │
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
│   │
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone <repository-url>
```

---

## Backend Setup

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Backend runs at:

```
http://127.0.0.1:8000
```

Swagger Documentation:

```
http://127.0.0.1:8000/docs
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

# 📊 Current Workflow

```
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

# 🔮 Future Scope

The next milestones will include:

- AI Pose Estimation using MediaPipe
- OpenCV Video Processing
- Skeleton Detection
- Joint Angle Calculation
- Injury Risk Prediction
- Performance Analytics Dashboard
- AI Report Generation
- Support for Cricket, Football, Badminton, Tennis, and more

---

# 👨‍💻 Team

**Project:** SportSense AI – Sports Injury Risk Detection System

Developed as part of the AI/ML Final Year Project.

---

# 📄 License

This project is developed for academic and educational purposes.