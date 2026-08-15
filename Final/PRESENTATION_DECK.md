# Sports Injury Risk Detection (SIRD) System
## Project Presentation Slide Deck

---

### Slide 1: Title Slide
* **Title**: Sports Injury Risk Detection (SIRD) System
* **Subtitle**: AI-Powered Biomechanical Motion Analysis & Real-Time Injury Prevention Platform
* **Category**: Computer Vision, Machine Learning, & Generative AI in Sports Medicine

---

### Slide 2: Technology Stack & System Architecture
* **FastAPI & Python 3.11**: Asynchronous REST server for high-throughput video processing and ML inference.
* **MediaPipe Pose Landmarker**: Real-time 3D posture detection extracting 33 body keypoints at 25+ FPS.
* **Scikit-Learn ML Ensembles**: 6 Random Forest Classifiers + IsolationForest Anomaly Engine.
* **React & HTML5 Canvas**: Interactive dashboard rendering live red joint nodes and yellow bone connection lines.
* **Google Gemini AI Agent**: LLM Generative AI Agent generating personalized clinical exercise prescriptions.

---

### Slide 3: Core Features & System Capabilities
* **Live Motion Capture Viewfinder**: Real-time HTML5 webcam canvas rendering skeletal node tracking and instant webm upload.
* **5-Factor Weighted Risk Scoring Model**:
  $$\text{Injury Risk Score} = 35\% (\text{Biomechanics}) + 20\% (\text{History}) + 20\% (\text{Asymmetry}) + 15\% (\text{Training Load}) + 10\% (\text{Fatigue})$$
* **Autonomous Exercise Prescriptions**: Dual-layer system with Gemini LLM primary agent and local Kinematic AI Expert System fallback.

---

### Slide 4: Problem Statement & Industry Challenges
* **Manual Visual Inspection**: Physical trainers rely on subjective observation, missing subtle dynamic knee valgus collapse, trunk sway, and micro-asymmetries.
* **Delayed Risk Intervention**: Injuries are diagnosed after structural ligament damage occurs rather than proactively predicted.
* **Lack of Explainable AI (XAI)**: Traditional ML models act as black boxes without natural language rationale explaining the exact kinematic causes.
* **Streamlined Prevention Platform**: Centralizing 3D pose tracking, multi-role triage, and AI prescriptions into a single web platform.

---

### Slide 5: System Architecture Overview
* **Modular Micro-Engine Architecture**: Decoupled video processing, ML inference, anomaly detection, and recommendation engines.
* **RESTful API Integration**: FastAPI endpoints serving 3D keypoint telemetry, automated PDF/CSV reports, and real-time alerts.
* **Role-Based Access Control**: JWT Bearer authentication securing Athlete, Coach, Physiotherapist, Scientist, and Admin views.
* **Scalable Asynchronous Storage**: Motor Async MongoDB Atlas driver handling high-throughput time-series keypoint telemetry.

---

### Slide 6: Engineering Challenges & Technical Solutions
* **Real-Time Canvas Rendering**: Optimized HTML5 Canvas `requestAnimationFrame` loop rendering 33 joint nodes and bone segments live at 25+ FPS without UI lag.
* **Explainable AI (XAI) Rationale**: Dynamic feature attribution generating plain language rationale notes explaining specific joint angle breakdowns (e.g., Knee Valgus 14.2°).
* **Generative AI Agent Integration**: Google Gemini LLM integration with local Kinematic AI Expert fallback ensuring 100% recommendation uptime.
* **Multi-Role Tailored Workspaces**: Customized analytical views for Athletes, Coaches, Physiotherapists, Scientists, and Administrators.

---

### Slide 7: Measurable Outcomes & Positive Impact
* **High ML Model Accuracy**: Cross-validated Random Forest models achieving 89.6% to 97.4% precision across 6 injury categories (ACL: 89.65%, Lower Back: 97.40%).
* **Proactive Risk Reduction**: Early detection of dynamic knee valgus collapse and force imbalance before physical injury manifestation.
* **Automated Practitioner Workflow**: Instant 1-click formatted PDF Medical Summary Reports and CSV Telemetry Data exports.
* **Roster-Wide Telemetry Analytics**: 12 fully processed realistic athlete profiles populated across all practitioner dashboards.

---

### Slide 8: UI Mock-ups & Dashboard Interfaces
* **Athlete View**: Personal risk scores, 3D Radar Chart, Body Heatmap, AI Exercise Routines, Subjective Recovery Logs.
* **Practitioner View**: Patient risk triage, movement correction analytics, custom prescription modal.
* **Scientist View**: Team performance trends, joint angle distribution histograms, ML model validation accuracy metrics.

---

### Slide 9: Athlete Motion Assessment Workflow
* **Step 1: Motion Video Submission**: Athlete uploads a video file or records live motion via the embedded HTML5 webcam capture modal.
* **Step 2: Pose Extraction & ML Inference**: MediaPipe extracts 33 3D keypoints; Random Forest models predict 6 category risks and 5-factor risk score.
* **Step 3: Multi-Role Triage & AI Prescriptions**: Results populate Athlete dashboards, alert assigned Coaches/Physios, and trigger Gemini AI exercise routines.

---

### Slide 10: Future Enhancements
* **Wearable Sensor Fusion**: Integrating IMU accelerometer and sEMG muscle activation telemetry with video keypoints.
* **Automated 3D Kinematic Avatar Rendering**: Three.js WebGL avatar rendering displaying real-time joint stress vectors.
* **Predictive Recovery Modeling**: Time-series LSTM neural networks forecasting long-term rehabilitation recovery curves.

---

### Slide 11: Team Members & Contributors
* **Lead Developer & AI Architect**: System design, MediaPipe & FastAPI backend integration.
* **Machine Learning Engineer**: Random Forest classifiers, IsolationForest anomaly detection, XAI feature attribution.
* **Frontend UI/UX Specialist**: React components, Glassmorphic CSS design, HTML5 Canvas tracking loop.
* **Backend & Cloud Engineer**: MongoDB Atlas motor async integration, JWT auth, Docker containerization.

---

### Slide 12: Presentation Video & Live Demonstration
* **Demonstration Video Link**: [Insert Google Drive Video Link Here](https://drive.google.com/file/d/1GAGHVWyuiXgearCHCusDrzPZBf9mK978/view?usp=sharing)

---

### Slide 13: Q & A
* Open floor for Questions & Answers on Biomechanical Pose Tracking, ML Ensembles, and Generative AI Prescriptions.

---

### Slide 14: Thank You
* Thank you for your time and feedback!
