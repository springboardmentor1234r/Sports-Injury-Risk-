# Milestone 3 Checklist: Injury Prediction & Recommendations

## Part 1: Models, Schemas & Database
- [ ] Create `milestone3/backend/models/injury_risk.py` (InjuryRiskPredictions)
- [ ] Create `milestone3/backend/models/anomaly.py` (MovementAnomalies)
- [ ] Create `milestone3/backend/models/risk_score.py` (RiskScores)
- [ ] Create `milestone3/backend/models/recommendation.py` (Recommendations)
- [ ] Create Pydantic schemas in `milestone3/backend/schemas/` corresponding to each model

## Part 2: Backend Engines & Services
- [ ] Implement Anomaly Detection Engine (`milestone3/backend/services/anomaly_service.py`)
  - Detect excessive knee valgus, unusual trunk lean, landing impact stiffness, stride deviations, and asymmetries
- [ ] Implement Injury Risk Prediction Engine (`milestone3/backend/services/prediction_service.py`)
  - Risk models for ACL, Hamstring, Ankle Sprain, Shoulder, Lower Back, and Overuse injury categories
- [ ] Implement Weighted Risk Scoring Engine (`milestone3/backend/services/scoring_service.py`)
  - Calculate Injury Risk, Movement Quality, Biomechanical Efficiency, Fatigue Risk, and overall Athlete Health scores (Weights: 35% Biomechanical, 20% History, 20% Asymmetry, 15% Load, 10% Fatigue)
- [ ] Implement Corrective Recommendation Engine (`milestone3/backend/services/recommendation_service.py`)
  - Rule-based suggestions for exercises, mobility drills, strengthening, recovery, and load adjustments

## Part 3: API Routers & Integration
- [ ] Create routers for status checks, start endpoints, and results lookup under `milestone3/backend/routers/`
- [ ] Register new Milestone 3 routers in main FastAPI application (`backend/app/main.py`)
- [ ] Support JWT/RBAC security using the existing authentication middleware

## Part 4: Frontend Components & Pages
- [ ] Create components for risk category cards, anomalies tables, score breakdowns, and recommendations in `milestone3/frontend/components/`
- [ ] Create main Athlete Intelligence Dashboard page in `milestone3/frontend/pages/AthleteIntelligence.jsx`
- [ ] Integrate Milestone 3 page route in `frontend/src/App.jsx`
- [ ] Register Athlete Intelligence Dashboard navigation in existing sidebar (`frontend/src/pages/Dashboard.jsx`)

## Part 5: End-to-End Testing & Walkthrough
- [ ] Verify backend routes compile and startup successfully
- [ ] Verify Vite frontend compiles and bundles cleanly
- [ ] Execute pipeline on actual uploaded videos and check MongoDB data population
- [ ] Write detailed user documentation in `milestone3/README.md` and `milestone3/walkthrough.md`
