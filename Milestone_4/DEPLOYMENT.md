# Deployment Guide

Covers PDF section 13 ("Final Integration, Testing & Deployment") and
section 7 ("Cloud & DevOps: Docker, AWS/Azure").

## 1. Local development (no Docker)

This is the setup you've already been using.

**Backend**
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # fill in your local Postgres credentials
uvicorn main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

## 2. Running the whole stack with Docker Compose

This spins up Postgres, the FastAPI backend, and the React frontend
(served by nginx) together.

```bash
cp .env       # fill in real values, especially SECRET_KEY
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Postgres: localhost:5432 (mapped for local `psql`/GUI access)

Video uploads persist in `backend/uploads` on the host (mounted as a
volume), and Postgres data persists in the `postgres_data` named volume,
so `docker compose down` doesn't lose either.

**Rebuilding after code changes**
```bash
docker compose up --build backend    # or frontend
```

**Running the test suite inside the backend container**
```bash
docker compose exec backend pytest tests/ -v
```

## 3. Deploying to the cloud (AWS / Azure)

The PDF lists AWS or Azure as example targets. Both work the same way
with these three pieces:

1. **Database** — a managed Postgres instance (AWS RDS for PostgreSQL, or
   Azure Database for PostgreSQL). Point `DATABASE_URL` at it.
2. **Backend** — push the `backend/` image built by `backend/Dockerfile`
   to a container registry (ECR / ACR) and run it on a container service
   (ECS/Fargate, App Runner, or Azure Container Apps / App Service for
   Containers). Set these environment variables on the service:
   - `DATABASE_URL`
   - `SECRET_KEY` (generate with `python -c "import secrets; print(secrets.token_hex(32))"`)
   - `CORS_ORIGINS` — your deployed frontend's real URL
   - `ALGORITHM=HS256`, `TOKEN_EXPIRE_HOURS=24`
3. **Frontend** — build `frontend/Dockerfile` with
   `--build-arg VITE_API_BASE=https://<your-backend-domain>` (Vite bakes
   this in at build time, so it must be set before/during the build, not
   after) and deploy the resulting nginx image the same way as the
   backend, or push the static `dist/` output to S3+CloudFront /
   Azure Static Web Apps instead of running nginx yourself.

**Persistent storage note**: `backend/uploads/videos` is a local
filesystem path. That's fine for a single-container deployment with an
attached volume/disk, but if you scale the backend to multiple
instances, switch this to object storage (S3 / Azure Blob) so every
instance sees the same uploaded videos — the architecture diagram in the
original spec already anticipated this ("Cloud Storage — AWS S3 / Azure
Blob" in the External Services column). That swap isn't implemented yet;
it's a follow-up, not part of this milestone.

## 4. Environment variables reference

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | backend | Postgres connection string |
| `SECRET_KEY` | backend | JWT signing secret — must be kept private |
| `ALGORITHM` | backend | JWT algorithm (`HS256`) |
| `TOKEN_EXPIRE_HOURS` | backend | How long a login session lasts |
| `CORS_ORIGINS` | backend | Comma-separated list of allowed frontend origins |
| `VITE_API_BASE` | frontend (build-time) | The backend URL the browser calls |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | docker-compose | Postgres container credentials |

## 5. Testing before you deploy

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

19 tests cover the biomechanics engine (Milestone 2), the injury risk /
anomaly detection / recommendation engine (Milestone 3), and the PDF/Excel
report generation (Milestone 4) — all pure-function tests with no database
required, so they run fast in CI.

For the frontend, `npm run lint` runs ESLint across every page and
component.
