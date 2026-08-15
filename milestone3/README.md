# Milestone 3: Week 5 & 6 — Injury Prediction & Recommendations

This directory contains the completed implementation for **Milestone 3** of the Sports Injury Risk Detection platform.

---

## 📋 Task List & Completion Status

- [x] **Implement Injury Risk Prediction Engine**
  - Built ML model training script (`train_models.py`) calibrated using statistical distributions from **Human3.6M**, **MPII Human Pose**, **COCO Keypoints**, **SportsPose**, and **FIFA Injury Data**.
  - Trained 6 Random Forest ML classifiers (`.joblib`) predicting probabilities across 6 distinct injury categories:
    - **ACL Injury Risk**
    - **Hamstring Injury Risk**
    - **Ankle Sprain Risk**
    - **Shoulder Injury Risk**
    - **Lower Back Injury Risk**
    - **Overuse Injury Risk**

- [x] **Build Movement Anomaly Detection Workflows**
  - Integrated `IsolationForest` anomaly classifier & rule-based kinematic anomaly detector (`anomaly_detection_engine.py`) to catch inward knee valgus collapse, stiff landing impacts, trunk sway, and bilateral limb force imbalance.

- [x] **Develop Risk Scoring Models**
  - Implemented composite risk model (`risk_scoring_engine.py`) calculating:
    - **Overall Injury Risk Score (0-100%)**
    - **Movement Quality Score (0-100%)**
    - **Symmetry Score (0-100%)**
    - **Fatigue Score (0-100%)**
    - **Overall Health Score (0-100%)**
    - **Risk Trajectory Trend** across historical sessions.

- [x] **Generate Corrective Recommendations**
  - Developed automated recommendation engine (`recommendation_engine.py`) generating corrective exercises, mobility drills, strengthening programs, and recovery modifications.
  - Implemented **Coach & Physiotherapist Custom Prescription Interface** (`CustomRecModal.jsx`) enabling practitioners to prescribe tailored drills and notes directly to assigned athletes.

- [x] **Create Athlete Intelligence Dashboards**
  - Enhanced all 5 role dashboards (Athlete, Coach, Physiotherapist, Sports Scientist, Administrator) with ML prediction cards, anatomical risk heatmaps, anomaly banners, and platform dataset metrics.

---

## 🚀 Key Outcomes Achieved
1. **ML Prediction Engine Operational**: Live model inference classifies risk probabilities for 6 injury categories under 100ms.
2. **Dynamic Risk Scoring Functional**: Composite risk scores and trajectory trends update dynamically on video upload.
3. **Dual Recommendation Workflow Completed**: Automated AI recommendations combined with custom coach prescription entries.
4. **Time-Series Telemetry Integrated**: Video uploads automatically log frame metrics to MongoDB Time Series collections (`telemetry_timeseries`).
