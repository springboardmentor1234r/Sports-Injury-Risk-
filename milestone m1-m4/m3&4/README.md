# Athlete Performance Hub

Athlete Performance Hub is a FastAPI/React application for authenticated athlete profiles, training loads, injury records, video pose processing, biomechanics, and explainable athlete-intelligence assessments.

## Milestone 3 and 4 status

The application now persists rule-based assessments, movement anomalies, and recommendations. The score transparently applies: biomechanical deviations 35%, historical injury factors 20%, movement asymmetry 20%, training-load indicators 15%, and fatigue indicators 10%. It is explicitly an analytical estimate and not a diagnosis, medical advice, or a clinically validated prediction.

The existing background video flow remains: upload -> pose estimation -> biomechanical metrics -> stored assessment/anomalies/recommendations. When no analyzed video is available, an assessment uses the available training and injury data and records that limitation.

## Local setup

Backend (Python 3.10+):

```powershell
cd backend
python -m pip install -r requirements.txt
$env:DATABASE_URL = "sqlite:///./athlete_hub.db" # optional local override
uvicorn app.main:app --reload
```

Frontend (Node 18+):

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`; the API interactive documentation is at `http://localhost:8000/docs`.

## Key APIs

- `GET /api/intelligence/athletes/{athlete_id}`: latest persisted assessment (creates one if none exists).
- `POST /api/intelligence/athletes/{athlete_id}/assess`: create a new assessment snapshot.
- `GET /api/intelligence/executive`: team-level dashboard for coach, physiotherapist, sports scientist, or administrator roles.

Athletes can access only their own intelligence data. Staff still use the existing athlete profile access checks; all intelligence routes enforce the same athlete restriction.

## Testing

```powershell
python verify_hub.py
cd frontend; npm run build
```

`verify_hub.py` uses its own SQLite test database. It verifies the integration workflow and deletes its test database on successful completion. It does not validate clinical accuracy, live MediaPipe performance, a real uploaded movement, Docker runtime, or AWS deployment.

## Docker

```powershell
docker compose config
docker compose up --build
```

The frontend production container uses same-origin `/api` and `/uploads` proxying to the backend container. Set `POSTGRES_PASSWORD` and `JWT_SECRET_KEY` in the environment before production use; the compose defaults are development-only.

## Deployment

See `deploy_aws.md`. It is a deployment configuration guide, not evidence that this application has been deployed to AWS.
