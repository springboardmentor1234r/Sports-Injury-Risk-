# Injury Risk Prediction, Scoring and Recommendations

This archive is the **Milestone 3** snapshot of the KineticGuard / Sports Injury Risk Detection project.

## Features included

- Everything from Milestone 2
- Weighted injury risk scoring
- Low/Moderate/High/Critical risk classification
- Biomechanical, symmetry, training-load and fatigue factors
- Injury probability indicators
- Movement findings/anomaly signals
- Corrective exercise and recovery recommendations
- Risk notifications and alerts

## Important

This is a source-code submission archive. Python virtual environments, `node_modules`, caches, generated databases, and uploaded sample videos are intentionally excluded. Install dependencies using `backend/requirements.txt` and `frontend/package.json`.

## Run

### Backend
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
