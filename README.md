# Video Processing, Pose and Biomechanical Analysis

This archive is the **Milestone 2** snapshot of the KineticGuard / Sports Injury Risk Detection project.

## Features included

- Everything from Milestone 1
- Video upload and validation
- Video preprocessing and metadata extraction
- OpenCV-based video quality and motion analysis
- Optional MediaPipe pose adapter
- Movement/pose signals and biomechanical metrics
- Analysis history and result visualization

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
