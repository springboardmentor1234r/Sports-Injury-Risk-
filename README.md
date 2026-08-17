# Athletiq AI

### AI-Powered Biomechanical Analysis, Injury Risk Detection & Athlete Performance Platform

**Athletiq AI** is an intelligent sports technology platform that combines **computer vision, biomechanical analysis, machine learning, anomaly detection, and Generative AI** to help athletes, coaches, physiotherapists, and sports scientists understand movement quality and reduce injury risk.

The platform processes athlete video or live camera feeds, extracts **33 3D body landmarks using MediaPipe Pose**, analyzes biomechanical movement patterns, predicts multiple injury risks using machine-learning ensembles, and generates personalized corrective exercise recommendations using Generative AI.

---

## 🚀 Project Overview

Athletiq AI transforms raw athlete movement into actionable sports-science insights.

The system analyzes:

* Knee valgus
* Trunk lean
* Landing mechanics
* Joint-angle abnormalities
* Movement asymmetry
* Movement stability
* Overall biomechanical anomalies

These measurements are combined with machine-learning predictions and a weighted risk-scoring engine to produce an understandable **Athlete Injury Risk Profile**.

The platform also provides AI-generated rehabilitation and corrective exercise recommendations tailored to the athlete's:

* Sport
* Playing position
* Movement mechanics
* Injury-risk profile
* Biomechanical measurements
* Recovery information

> **Athletiq AI is designed as a decision-support and injury-prevention platform and should not replace professional medical diagnosis or clinical judgment.**

---

# 🎯 Key Features

## 1. Real-Time AI Motion Capture

Athletiq AI provides a live camera interface for analyzing athlete movement.

### Capabilities

* HTML5 camera integration
* Real-time pose detection
* 33-point body landmark tracking
* Skeletal visualization
* Shoulder, elbow, wrist, hip, knee and ankle tracking
* Live biomechanical feedback
* Motion-event recording
* Automatic submission of recorded clips for deeper analysis

The interface displays the athlete's skeleton using joint nodes and connecting bone segments, allowing users to visually understand movement patterns in real time.

---

# 🦴 2. 3D Biomechanical Analysis

Athletiq AI uses **MediaPipe Pose Landmarking** to extract body keypoints from video.

The system converts these landmarks into biomechanical features such as:

* Knee flexion
* Knee valgus
* Hip alignment
* Trunk inclination
* Shoulder alignment
* Ankle position
* Landing stiffness
* Left/right movement asymmetry
* Joint-angle distributions

These features become the foundation for downstream machine-learning and risk-analysis systems.

---

# 🤖 3. Multi-Model Injury Risk Prediction

Athletiq AI uses a collection of specialized **Random Forest machine-learning classifiers** to estimate different injury-risk categories.

### Current Risk Models

| Risk Category        | ML Model      |
| -------------------- | ------------- |
| ACL Strain           | Random Forest |
| Hamstring Tear       | Random Forest |
| Ankle Sprain         | Random Forest |
| Shoulder Impingement | Random Forest |
| Lower Back Stress    | Random Forest |
| Overuse Fatigue      | Random Forest |

Each model evaluates relevant biomechanical features and produces an individual risk probability.

The system can then combine these predictions into a unified athlete risk profile.

---

# 🔍 4. Movement Anomaly Detection

Athletiq AI includes an **Isolation Forest anomaly-detection engine**.

The anomaly engine identifies movement patterns that significantly deviate from expected biomechanical behavior.

This can help detect:

* Severe form collapse
* Unusual movement patterns
* Abnormal landing mechanics
* Significant asymmetry
* Unexpected changes in movement quality

Anomaly detection provides an additional layer of protection beyond traditional supervised injury-risk models.

---

# 📊 5. Intelligent Risk Scoring

Athletiq AI combines multiple signals into a unified **Injury Risk Score**.

The scoring engine considers multiple factors, including:

1. Machine-learning injury predictions
2. Biomechanical measurements
3. Movement anomalies
4. Movement asymmetry
5. Overall movement quality

This multi-factor approach allows the system to move beyond a single ML prediction and provide a broader assessment of athlete movement risk.

### Example

A high-risk assessment could be influenced by:

> Dynamic knee valgus + poor landing mechanics + movement asymmetry + abnormal trunk lean + elevated ACL model probability.

---

# 🧠 6. Generative AI Recommendation Agent

Athletiq AI integrates a **Generative AI recommendation agent** to convert biomechanical findings into personalized corrective exercise recommendations.

The AI considers:

* Athlete movement data
* 3D body keypoints
* Sport
* Playing position
* Injury-risk predictions
* Biomechanical abnormalities
* Overall risk score

The resulting recommendations can include:

* Mobility exercises
* Strengthening exercises
* Stability drills
* Landing-mechanics drills
* Movement-control exercises
* Recovery recommendations
* Corrective exercise routines

A local **Kinematic AI Expert System** can act as a fallback recommendation mechanism when the Generative AI service is unavailable.

---

# 💡 7. Explainable AI

Athletiq AI is designed not only to provide a risk score but also to explain **why** the score was produced.

The system generates human-readable explanations using relevant biomechanical features.

### Example

> **ACL Risk: Elevated**

> Primary contributors include dynamic knee valgus of **14.2°**, reduced landing knee flexion of **28.5°**, and increased left/right movement asymmetry.

This makes the ML output easier for coaches, physiotherapists, and sports scientists to interpret.

---

# 👥 8. Multi-Role Athlete Intelligence Platform

Athletiq AI provides role-specific workspaces.

## 🏃 Athlete Dashboard

Athletes can access:

* Personal injury-risk scores
* Biomechanical analytics
* Movement visualizations
* AI-generated exercise routines
* Recovery logs
* Historical movement trends
* Personalized recommendations

---

## 🧑‍🏫 Coach Dashboard

Coaches can monitor:

* Team injury-risk profiles
* Athlete risk rankings
* Movement abnormalities
* Athlete comparison analytics
* Corrective exercise recommendations
* Risk-trend monitoring

This enables coaches to identify athletes who may require additional attention.

---

## 🩺 Physiotherapist Workspace

Physiotherapists can access:

* Detailed movement analysis
* Joint-angle measurements
* Risk-factor explanations
* Athlete movement history
* Corrective exercise recommendations
* Custom rehabilitation prescriptions
* Patient-specific analytics

Practitioners can also create customized exercise prescriptions through the platform.

---

## 🔬 Sports Scientist Workspace

Sports scientists can analyze:

* Team performance trends
* Joint-angle distributions
* Movement-quality statistics
* ML model performance
* Risk distributions
* Cohort-level analytics
* Research datasets
* Anonymized telemetry exports

This workspace is intended to support sports-performance research and evidence-based decision making.

---

## 🛠️ Administrator Dashboard

Administrators can monitor:

* User accounts
* Role management
* Server health
* API throughput
* Request latency
* Database status
* System diagnostics

---

# 📈 Biomechanical Visualization

Athletiq AI provides interactive visualization tools including:

### Radar Charts

Used to represent multiple dimensions of athlete movement quality and risk.

### Body Heatmaps

Used to highlight areas associated with elevated biomechanical stress.

### Joint-Angle Histograms

Used by sports scientists to understand movement distributions across athletes or teams.

### Risk Dashboards

Provide an at-a-glance overview of:

* Overall injury risk
* Individual injury categories
* Anomaly scores
* Biomechanical contributors
* Historical changes

---

# 📄 Automated Reporting

Athletiq AI supports automated export of athlete analytics.

### PDF Medical Summary

Reports can include:

* Athlete profile
* Overall risk score
* Injury-risk categories
* Biomechanical measurements
* ML explanations
* AI recommendations
* Movement observations

### CSV Telemetry Export

Raw and processed movement data can be exported for:

* Research
* Statistical analysis
* Sports-science studies
* Model validation
* Long-term athlete monitoring

---

# 🏗️ System Architecture

```text
                    ATHLETIQ AI
                         │
            ┌────────────┴────────────┐
            │                         │
      Live Camera                 Video Upload
            │                         │
            └────────────┬────────────┘
                         │
                  MediaPipe Pose
                         │
                  33 3D Keypoints
                         │
                         ▼
             Biomechanical Engine
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
 Joint Analysis     Asymmetry       Movement Features
        │                │                │
        └────────────────┼────────────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
       Random Forest          Isolation Forest
       Risk Models            Anomaly Engine
              │                     │
              └──────────┬──────────┘
                         │
                         ▼
                 Risk Scoring Engine
                         │
                         ▼
                 Explainable AI
                         │
                         ▼
              Generative AI Agent
                         │
                         ▼
            Personalized Recommendations
                         │
              ┌──────────┼──────────┐
              │          │          │
              ▼          ▼          ▼
           Athlete     Coach    Physiotherapist
                         │
                         ▼
                   Sports Scientist
```

---

# 📁 Repository Structure

```text
Athletiq-AI/
│
├── milestone4/
│   │
│   ├── backend/
│   │   ├── app/
│   │   │   ├── auth.py
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   ├── schemas.py
│   │   │   │
│   │   │   ├── engines/
│   │   │   │   ├── ai_recommendation_agent.py
│   │   │   │   ├── anomaly_detection_engine.py
│   │   │   │   ├── ml_prediction_engine.py
│   │   │   │   └── risk_scoring_engine.py
│   │   │   │
│   │   │   ├── routes/
│   │   │   │   ├── auth_routes.py
│   │   │   │   ├── notification_routes.py
│   │   │   │   ├── recommendation_routes.py
│   │   │   │   ├── report_routes.py
│   │   │   │   ├── system_routes.py
│   │   │   │   └── video_routes.py
│   │   │   │
│   │   │   └── seed_12_athletes.py
│   │   │
│   │   ├── tests/
│   │   │   └── test_api_suite.py
│   │   │
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   │   ├── BiomechanicalCharts.jsx
│       │   │   ├── CustomRecModal.jsx
│       │   │   ├── LiveCameraModal.jsx
│       │   │   └── NotificationBell.jsx
│       │   │
│       │   ├── pages/
│       │   │   ├── Dashboard.jsx
│       │   │   └── Login.jsx
│       │   │
│       │   ├── App.jsx
│       │   └── index.css
│       │
│       ├── package.json
│       └── vite.config.js
│
├── .gitignore
└── README.md
```

---

# ⚙️ Technology Stack

## Frontend

* React
* Vite
* JavaScript
* HTML5 Canvas
* Modern CSS
* Responsive Web UI

## Backend

* Python
* FastAPI
* Pydantic
* Uvicorn
* Pytest

## Computer Vision

* MediaPipe Pose
* 3D body landmark extraction
* Video processing
* Real-time camera tracking

## Machine Learning

* Scikit-learn
* Random Forest Classifiers
* Isolation Forest
* Feature engineering
* Explainable AI

## Generative AI

* Google Gemini API
* AI recommendation agent
* Natural-language exercise prescription
* Kinematic expert-system fallback

## Database

* MongoDB Atlas
* Motor asynchronous database driver

## Authentication

* JWT
* OAuth2
* Role-based access control

## Deployment

* Netlify
* Docker
* MongoDB Atlas
* Cloud-based API infrastructure

---

# 🚀 Installation & Setup

## 1. Prerequisites

Install:

```text
Python 3.11+
Node.js 18+
MongoDB Atlas or Local MongoDB
```

---

## 2. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>

cd Athletiq-AI
```

---

## 3. Backend Installation

```bash
cd milestone4/backend

pip install -r requirements.txt
```

---

## 4. Environment Configuration

Create a `.env` file inside:

```text
milestone4/backend/
```

Example:

```env
MONGODB_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/athletiq_ai

JWT_SECRET_KEY=your_jwt_secret_key

GEMINI_API_KEY=your_gemini_api_key

PORT=8000
HOST=127.0.0.1
```

**Never commit `.env` files or API keys to GitHub.**

---

# 🌱 Demo Data

Athletiq AI includes a demo seeding script for creating processed athlete profiles.

Run:

```bash
python app/seed_12_athletes.py
```

This creates a demonstration roster and populates the system with sample movement-analysis and injury-risk information.

---

# ▶️ Running the Backend

From:

```text
milestone4/backend
```

run:

```bash
python -m uvicorn app.main:app --reload --port 8000
```

The API will be available at:

```text
http://localhost:8000
```

FastAPI Swagger documentation:

```text
http://localhost:8000/docs
```

---

# ▶️ Running the Frontend

Open another terminal:

```bash
cd milestone4/frontend

npm install

npm run dev
```

The development frontend will then be available through the Vite development server.

---

# 🧪 Automated Testing

Run:

```bash
cd milestone4/backend

pytest
```

The current project test suite is designed to validate the core backend API functionality.

Expected demonstration result:

```text
5/5 Tests Passed
100% Pass Rate
```

---

# 🔐 Demo Accounts

The application supports multiple role-based demo accounts.

| Role             | Email                       | Password      |
| ---------------- | --------------------------- | ------------- |
| Athlete          | `marcus.rashford@sird.com`  | `password123` |
| Coach            | `coach.alex@sird.com`       | `password123` |
| Physiotherapist  | `physio.john@sird.com`      | `password123` |
| Sports Scientist | `scientist.newton@sird.com` | `password123` |
| Administrator    | `admin@sird.com`            | `admin123`    |

> **Important:** These credentials are for demonstration/development environments only. Replace them with secure credentials before any production deployment.

---

# 🔬 Injury-Risk Pipeline

The core Athletiq AI pipeline can be summarized as:

```text
Video / Live Camera
        ↓
Pose Detection
        ↓
33 3D Body Keypoints
        ↓
Biomechanical Feature Extraction
        ↓
Movement Analysis
        ↓
Random Forest Injury Models
        +
Isolation Forest Anomaly Detection
        ↓
Weighted Risk Scoring
        ↓
Explainable AI
        ↓
Generative AI Recommendation Agent
        ↓
Personalized Corrective Exercise Plan
        ↓
Athlete / Coach / Physiotherapist Dashboard
```

---

# 🌟 What Makes Athletiq AI Different?

Traditional sports injury analysis often requires manual observation, specialized equipment, or retrospective assessment.

Athletiq AI aims to make biomechanical intelligence more accessible by combining:

**Computer Vision + Biomechanics + Machine Learning + Anomaly Detection + Explainable AI + Generative AI**

into a single platform.

Instead of simply reporting:

> **"ACL Risk: 72%"**

Athletiq AI attempts to provide a complete explanation:

> **"ACL risk is elevated due to increased dynamic knee valgus, reduced landing knee flexion, and movement asymmetry."**

It can then transform those findings into an actionable corrective exercise recommendation.

---

# 🔮 Future Development

Potential future improvements include:

* Wearable sensor integration
* IMU-based motion analysis
* Multi-camera 3D reconstruction
* Athlete longitudinal risk prediction
* Personalized ML models
* Sports-specific injury models
* Automatic exercise form verification
* Voice-based AI coaching
* Mobile application
* Team-level injury forecasting
* Federated learning for privacy-preserving model training
* Advanced temporal deep-learning models
* Transformer-based video understanding
* Integration with electronic health-record systems
* Research-grade biomechanical datasets

---

# 🛡️ Privacy & Responsible AI

Athletiq AI is designed with responsible sports-data processing in mind.

Important principles include:

* Secure authentication
* Role-based access control
* Controlled access to athlete information
* Anonymized research exports
* Secure API-key management
* Protection of sensitive athlete data

AI-generated recommendations should be reviewed by qualified professionals before being used as part of an athlete's clinical rehabilitation program.

---

# ⚠️ Medical Disclaimer

Athletiq AI is a **sports technology and decision-support platform**.

The system's injury-risk predictions are probabilistic estimates and **do not constitute a medical diagnosis**.

Athletes experiencing pain, injury, or concerning symptoms should consult an appropriately qualified healthcare professional.

AI-generated exercise recommendations should be reviewed by a qualified physiotherapist, sports physician, or other relevant healthcare professional before clinical implementation.

---

# 👨‍💻 Project Summary

**Athletiq AI** demonstrates how modern AI technologies can be combined to build an end-to-end intelligent sports-health platform.

The project integrates:

* Real-time computer vision
* 3D pose estimation
* Biomechanical feature engineering
* Six specialized Random Forest models
* Isolation Forest anomaly detection
* Multi-factor injury-risk scoring
* Explainable AI
* Generative AI
* Personalized exercise recommendations
* Role-based dashboards
* Automated reporting
* Athlete analytics
* Cloud deployment

The ultimate goal of Athletiq AI is to move sports injury prevention from **reactive treatment toward proactive, data-driven movement intelligence**.

---

## 🏆 Athletiq AI

**See the movement. Understand the risk. Prevent the injury.**

**Computer Vision × Biomechanics × Machine Learning × Generative AI**
