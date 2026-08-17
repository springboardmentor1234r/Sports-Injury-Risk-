# Athletiq AI – Sports Injury Risk Detection from Video

**Athletiq AI** is an AI-powered sports injury intelligence platform that analyzes athlete movement videos, detects biomechanical flaws, tracks 3D pose landmarks, calculates weighted injury risks, predicts specific injury types using ensemble machine learning, and generates personalized corrective recommendations.

---

## 🌟 Key Platform Features

- **White + Green Modern Aesthetic**: Professional healthcare & sports analytics UI (`#15803D` Primary Green, `#DCFCE7` Soft Light Green, `#F8FAF9` Background).
- **Role-Based Account Registration**: Users select their role (**Athlete**, **Coach**, **Physiotherapist**, **Sports Scientist**, **Administrator**) during sign-up.
- **Dynamic Coach Dashboard Sync**: Newly registered athletes automatically create a linked MongoDB profile and instantly appear in the Coach Dashboard roster.
- **Strict Data Isolation Security**: JWT authorization middleware enforces strict ownership checks — returning `403 Forbidden` if an athlete attempts to access another athlete's private dashboard or reports.
- **MediaPipe / OpenCV Pose Engine**: Extracts 33 human pose keypoints, tracks motion trajectories, and draws interactive skeleton overlays.
- **Biomechanical Joint Angle Engine**: Computes dynamic 3D joint angles (knee, hip, trunk lean), symmetry index (0-100%), knee valgus ratio, and landing mechanics.
- **IsolationForest Anomaly Detector**: Identifies sudden joint angle deviations, asymmetric gait, and movement anomalies.
- **6 Ensemble Random Forest Injury Predictors**: Predicts probabilities for:
  1. ACL Injury Risk
  2. Hamstring Injury Risk
  3. Ankle Sprain Risk
  4. Shoulder Injury Risk
  5. Lower Back Injury Risk
  6. Overuse Injury Risk
- **35/20/20/15/10 Weighted Risk Scoring Engine**: Calculates overall injury risk score (0-100) and risk category (Low, Moderate, High, Critical).
- **AI Recommendation Agent**: Generates actionable corrective exercise, mobility, strengthening, recovery, and training modification plans.
- **Notification Drawer System**: Real-time popover drawer for high-risk warnings and analysis completions.
- **Dual Database Reliability**: MongoDB driver with automatic embedded JSON persistence fallback for 100% out-of-the-box local execution.

---

## 👥 Roles and Permissions

| Role | Access Permissions |
| :--- | :--- |
| **Athlete** | Personal Dashboard (`/athlete/dashboard`), Video Upload & Analysis, Personal Predictions, Recommendations, Reports, Profile. Strictly blocked from accessing other athletes (`403 Forbidden`). |
| **Coach** | Team Dashboard (`/coach/dashboard`), Dynamic Registered Athlete Roster (`/athletes`), Team Risk Distribution, Video Analysis, Reports. |
| **Physiotherapist** | Rehab Dashboard (`/physiotherapist/dashboard`), Movement Correction Analytics, Recovery Trends, Corrective Protocol Status Updates. |
| **Sports Scientist** | Lab Dashboard (`/scientist/dashboard`), 3D Joint Angle Telemetry, IsolationForest Outlier Telemetry, Research Data Summaries. |
| **Administrator** | Admin Control Center (`/admin/dashboard`), User Management (Activate/Deactivate/Delete), System Diagnostics, API Health. |

---

## 🔑 Demo Login Credentials

You can use the 1-Click Demo Buttons on the Login screen or use these credentials:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Athlete** | `athlete@athletiq.ai` | `Password123!` |
| **Coach** | `coach@athletiq.ai` | `Password123!` |
| **Physiotherapist** | `physio@athletiq.ai` | `Password123!` |
| **Sports Scientist** | `scientist@athletiq.ai` | `Password123!` |
| **Administrator** | `admin@athletiq.ai` | `Password123!` |

---

## 🛠 Technology Stack

### Frontend
- **Framework**: React.js 18 + Vite
- **Routing**: React Router DOM v6
- **Styling**: Modern CSS variables (White + Green theme)
- **Charts**: Recharts (Radar, Bar, Line)
- **Icons**: Lucide React
- **HTTP Client**: Axios

### Backend
- **Framework**: Python 3.11 + FastAPI
- **Auth**: JWT Tokens (jose) + SHA256/Bcrypt password hashing
- **ML / AI**: OpenCV, MediaPipe Pose, NumPy, Pandas, Scikit-Learn (RandomForestClassifier, IsolationForest)
- **Database**: MongoDB (via Motor/PyMongo) + Embedded Local JSON Persistence Engine fallback

---

## 📁 Project Structure

```
Milestone 3/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── auth.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── schemas.py
│   │   ├── models.py
│   │   ├── dependencies.py
│   │   ├── engines/
│   │   │   ├── pose_estimation_engine.py
│   │   │   ├── biomechanical_analysis_engine.py
│   │   │   ├── ml_prediction_engine.py
│   │   │   ├── anomaly_detection_engine.py
│   │   │   ├── risk_scoring_engine.py
│   │   │   └── ai_recommendation_agent.py
│   │   ├── routes/
│   │   │   ├── auth_routes.py
│   │   │   ├── athlete_routes.py
│   │   │   ├── video_routes.py
│   │   │   ├── analysis_routes.py
│   │   │   ├── recommendation_routes.py
│   │   │   ├── notification_routes.py
│   │   │   ├── report_routes.py
│   │   │   └── system_routes.py
│   │   └── seed_12_athletes.py
│   ├── tests/
│   │   ├── test_api_suite.py
│   │   └── run_tests.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Topbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── RoleBasedRoute.jsx
│   │   │   ├── VideoUpload.jsx
│   │   │   ├── RiskScoreCard.jsx
│   │   │   ├── BiomechanicalCharts.jsx
│   │   │   ├── SkeletonViewer.jsx
│   │   │   ├── RecommendationCard.jsx
│   │   │   ├── NotificationBell.jsx
│   │   │   └── AnalysisHistoryTable.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── AthleteDashboard.jsx
│   │   │   ├── CoachDashboard.jsx
│   │   │   ├── PhysiotherapistDashboard.jsx
│   │   │   ├── SportsScientistDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── InjuryRiskAnalysis.jsx
│   │   │   ├── AthleteProfiles.jsx
│   │   │   ├── AnalysisHistory.jsx
│   │   │   ├── Recommendations.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── Notifications.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── Settings.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── README.md
├── docker-compose.yml
└── .gitignore
```

---

## ⚡ How to Run Locally

### 1. Run Backend (FastAPI)
```bash
cd backend
python -m venv venv
# Activate virtual environment
# Windows: venv\Scripts\activate
pip install -r requirements.txt
python app/seed_12_athletes.py
uvicorn app.main:app --reload --port 8000
```
Backend Swagger Documentation: `http://localhost:8000/docs`

### 2. Run API Test Suite
```bash
python backend/tests/run_tests.py
```

### 3. Run Frontend (Vite + React)
```bash
cd frontend
npm install
npm run dev
```
Frontend Web Application: `http://localhost:5173`

---

## 🚀 Milestone Progress Summary

### Milestone 1 (Completed)
- JWT Authentication & Authorization
- Role selection during registration
- Role-based automatic dashboard redirection
- Seeded 12 athlete profiles (Virat Kohli, Dhruv, Sanskar, Aditi, Rahul, Priya, Arjun, Sneha, Kiran, Ananya, Rohit, Meera)
- Athlete Profile CRUD APIs

### Milestone 2 (Completed)
- Injury Risk Analysis Lab
- 200 MB Video Drag & Drop Uploader
- Multi-step 12-stage animated processing bar
- OpenCV & MediaPipe 3D Keypoint Pose Engine
- Biomechanical joint angle calculation (Knee angle, Hip angle, Trunk lean, Symmetry, Knee Valgus ratio)

### Milestone 3 (Completed)
- 6 Random Forest Injury Prediction Models (ACL, Hamstring, Ankle, Shoulder, Lower Back, Overuse)
- IsolationForest Movement Anomaly Detector
- 35/20/20/15/10 Weighted Injury Risk Scoring Formula
- AI Recommendation Agent (Exercise, Mobility, Strengthening, Recovery, Training Modification)
- Interactive Notification Drawer System
- PDF/Printable Report Document Generator
- Strict Backend Data Isolation (HTTP 403 Forbidden enforcement)
- Dynamic Registered Athlete Roster Sync to Coach Dashboard

---

## 🔮 Future Scope (Milestone 4)
- Real-time webcam live skeletal tracking feed.
- Multi-camera 3D motion capture integration.
- Custom trained Deep Learning model weights (YOLOv8-Pose / HigherHRNet) replacement module.
- Wearable sensor data telemetry fusion (IMU / Force plate integration).
