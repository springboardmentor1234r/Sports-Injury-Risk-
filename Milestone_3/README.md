# Milestone 3: Injury Prediction & Recommendations

This directory contains the implementations for the **Injury Risk Prediction Engine**, **Movement Anomaly Detection**, **Weighted Risk Scoring Models**, and the **Athlete Intelligence Dashboard** for KineticGuard.

---

## 1. Architectural Layout

Milestone 3 is strictly separated from existing codebases and organized within this subdirectory:

```text
milestone3/
├── backend/
│   ├── models/
│   │   ├── injury_risk.py         # MongoDB structures for ACL, Hamstring, Ankle, etc.
│   │   ├── anomaly.py             # MongoDB schema for movement deviations
│   │   ├── risk_score.py          # MongoDB document format for weighted calculations
│   │   └── recommendation.py      # Actionable corrective advice collections
│   ├── schemas/
│   │   ├── injury_risk.py         # Pydantic validation for injury risk predictions
│   │   ├── anomaly.py             # Validation for detected anomalies
│   │   ├── risk_score.py          # Validation for calculated metrics
│   │   └── recommendation.py      # Validation for corrective workouts
│   ├── services/
│   │   ├── anomaly_service.py     # Kinematics aberration checks
│   │   ├── prediction_service.py  # Segmental risk indicators calculation
│   │   ├── scoring_service.py     # Score compilation using specified weights
│   │   └── recommendation_service.py # Generates data-driven corrective logs
│   └── routers/
│       ├── injury_risk.py
│       ├── anomalies.py
│       ├── risk_score.py
│       ├── recommendations.py
│       └── intelligence.py        # Centralized endpoint to query intelligence stats
├── frontend/
│   ├── components/
│   │   ├── InjuryCards.jsx        # Grid cards display risk metrics per joint category
│   │   ├── AnomalyTable.jsx       # Severity-coded grid listing technique errors
│   │   ├── ScoreBreakdown.jsx     # Gauge graphs displaying weighted factor splits
│   │   └── CorrectiveExercises.jsx# List showing corrective movement guides
│   └── pages/
│       └── AthleteIntelligence.jsx# Main screen for Milestone 3 Workspace dashboard
├── README.md
├── task.md
└── walkthrough.md
```

---

## 2. Technical Details & Specifications

### Risk Weighting Formula
We implement the transparent scoring system exactly as specified:
* **Biomechanical Deviations:** 35%
* **Historical Injury Factors:** 20%
* **Movement Asymmetry:** 20%
* **Training Load Indicators:** 15%
* **Fatigue Indicators:** 10%

### Risk Level Ranges
* **0 - 25%:** LOW (Low Risk)
* **26 - 50%:** MODERATE (Moderate Risk)
* **51 - 75%:** HIGH (High Risk)
* **76 - 100%:** CRITICAL (Critical Risk)

### Injury Categories Evaluated
1. **ACL Risk:** Evaluated using peak knee valgus angle, landing flexion at touchdown, and lateral knee displacement.
2. **Hamstring Risk:** Evaluated using peak velocity, hamstring elongation indicators, and asymmetry in extension.
3. **Ankle Sprain Risk:** Evaluated using touchdown lateral ankle roll vectors, balance center-of-mass shift, and landing stability.
4. **Shoulder Risk:** Evaluated using posture tilt symmetry and shoulder tilt range during activity.
5. **Lower Back Risk:** Evaluated using trunk lean, hip-shoulder stability offset, and stance asymmetry.
6. **Overuse Risk:** Evaluated using training load calculations (ACWR) and fatigue-related movement degradation.
