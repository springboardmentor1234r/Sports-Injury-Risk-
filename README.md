# Sports Injury Risk Detection from Video

AI-powered platform analyzing athlete movement videos to detect biomechanical
risk factors and predict potential injuries before they occur.

Infosys Springboard Virtual Internship (June–Aug 2026).

## Tech Stack
- Frontend: React (Vite)
- Backend: FastAPI (Python)
- Database: PostgreSQL
- Auth: JWT (python-jose) + bcrypt
- CV/AI: OpenCV, MediaPipe

## Milestone Status
- [x] Milestone 1: Setup, auth, athlete profiles, dataset prep
- [ ] Milestone 2: Pose estimation, biomechanical analysis (in progress)
- [ ] Milestone 3: Injury prediction & recommendations
- [ ] Milestone 4: Dashboards, testing, deployment

## Setup

### Backend
```
cd backend
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # then fill in DATABASE_URL and SECRET_KEY
uvicorn main:app --reload --port 8000
```
Docs at http://localhost:8000/docs

### Database
```
createdb sports_injury_db
psql sports_injury_db < db/schema.sql
```

### Frontend
```
cd frontend
npm install
npm run dev
```
Runs at http://localhost:5173

## API Overview
- POST /auth/register, /auth/login
- GET/POST/PUT /athletes/me, GET /athletes/{id}
- POST /videos/upload, GET /videos/mine, POST /videos/{id}/process


