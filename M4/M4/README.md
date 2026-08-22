# Complete Sports Injury Risk Detection Platform

This archive is the **Milestone 4** snapshot of the KineticGuard / Sports Injury Risk Detection project.

## Features included

- Complete Milestones 1-3
- Role-based analytics dashboards
- Risk and movement reports
- PDF and CSV export
- Notifications and alerts
- Automated tests
- Docker/containerization files
- Final integrated project structure

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
