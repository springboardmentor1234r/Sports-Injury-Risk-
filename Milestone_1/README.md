# MoveIQ - Advanced Sports Injury Risk Assessment Platform

![MoveIQ Banner](https://via.placeholder.com/1200x300?text=MoveIQ+Sports+Injury+Analysis)

MoveIQ is an end-to-end, highly scalable AI-powered platform designed to analyze athletic movements in real-time, predict injury risks, and provide biomechanical feedback to both athletes and coaches. The system relies on advanced machine learning algorithms processed via a distributed background worker system, ensuring a smooth, non-blocking experience for end users.

---

## 🏗️ System Architecture & Data Flow

MoveIQ uses a **Microservice-like architecture** heavily reliant on asynchronous processing.

1. **Client Layer:** Athletes/Coaches upload videos or send chat messages.
2. **API Layer (FastAPI):** Receives requests, handles authentication (JWT), and performs rate-limiting (SlowAPI). It offloads heavy tasks immediately.
3. **Queue Layer (Celery & Redis):** High-priority tasks (Emails/OTPs) and Video Processing tasks are placed in distinct queues.
4. **Storage Layer:** 
   * **MySQL/PostgreSQL:** Relational data (Users, Roles, Coaching relationships).
   * **MongoDB:** Unstructured/Heavy data (Biomechanical analysis, AI Reports, Chat histories).
   * **Elasticsearch:** Fast, fuzzy-searchable athlete profiles for the Coach dashboard.
5. **Worker Layer:** Python Celery workers process videos, interact with Cloudinary, and call the Groq LLM API for recommendations.

---

## 🎥 End-to-End Video Processing Pipeline

Because analyzing sports footage requires heavy ML operations, MoveIQ is built around a completely non-blocking, asynchronous video pipeline. Here is exactly what happens when a user uploads a video:

1. **Upload & Verification:** The user calls `/api/sessions/upload-and-analyze`. FastAPI intercepts the upload, checks for valid extensions (`.mp4`, `.mov`, `.avi`), and enforces a strict **500MB file size limit**.
2. **Temporary Disk Buffer:** To free up the network request immediately, the file is buffered to local disk, a MongoDB session is generated, and a Celery background task is enqueued. The API responds to the user in milliseconds.
3. **Cloud Storage Handoff:** The Celery worker picks up the task and securely uploads the local video to **Cloudinary** for distributed storage. The local disk file is immediately wiped to prevent disk exhaustion.
4. **AI Biomechanics Analysis:** The worker passes the secure Cloudinary URL to the core ML pipeline. The AI extracts granular metrics (joint angles, biomechanical efficiency, and movement quality scores) frame-by-frame.
5. **LLM Coaching Insights:** If a high injury risk is detected, the raw numbers are passed securely to a **Groq-powered LangGraph** engine. This acts as a virtual AI Coach, translating complex numbers into actionable, plain-English advice.
6. **Real-Time WebSocket Feedback:** Throughout this entire background process, the worker publishes live JSON updates to a **Redis Pub/Sub** channel. The frontend listens to these updates via WebSockets (`/api/ws/progress`), presenting a smooth, live progress bar to the user.
7. **Elasticsearch Sync:** Once complete, the final Risk Category and scores are committed to MongoDB, and an asynchronous `sync_athlete_to_es` task is fired to update the athlete's profile in Elasticsearch, updating the Coach's dashboard instantly.

---

## ⚡ Scalability & Capacity Limitations

MoveIQ was explicitly engineered to handle high concurrent loads without crashing. Here is a breakdown of system capacity:

### 1. The API & WebSocket Layer (High Capacity)
* **Capacity:** ~5,000 to 10,000+ concurrent users.
* **Explanation:** FastAPI runs on `uvicorn` and handles basic CRUD operations asynchronously. Database queries to MongoDB use `$in` bulk queries to prevent N+1 bottlenecks. Redis handles WebSocket chat and progress bars, easily supporting thousands of live connections on a basic server.

### 2. Video Upload Queue (High Capacity, Hardware Bound)
* **Capacity:** ~1,000+ queued users simultaneously.
* **Explanation:** The API handles uploads quickly, limits them to 500MB, saves them to a temporary disk, and enqueues the task. The only limit is server network bandwidth and temporary disk storage.

### 3. AI Processing & Recommendation Engine (The Bottleneck)
* **Capacity:** Bound by third-party APIs (Cloudinary/Groq) and Worker count.
* **Explanation:** While thousands of users can *upload*, the processing speed is limited. If Groq limits you to 30 requests/minute, only 30 users per minute will get their final AI recommendations. If you have 2 Celery workers, only 2 videos are processed simultaneously. The rest wait safely in the Redis queue.

---

## 🛠️ Technology Stack

* **Backend Framework:** FastAPI (Python 3.10+)
* **Distributed Task Queue:** Celery with Redis Broker
* **In-Memory Cache & PubSub:** Redis (for WebSockets & OTPs)
* **Relational Database:** MySQL (User Auth, Roles, Relationships)
* **NoSQL Database:** MongoDB (AI Reports, Biomechanics, Chat)
* **Search Engine:** Elasticsearch (Fuzzy searching for Coach Dashboard)
* **AI/LLM Provider:** Groq / LangGraph (Rapid recommendation generation)
* **Media Storage:** Cloudinary
* **Testing:** Pytest with extensive `unittest.mock` usage

---

## 🚧 Challenges Faced & Solutions

Building a hybrid AI/Video processing app at this scale introduced several unique architectural challenges:

1. **The AI Processing Bottleneck (Event Loop Blocking)**
   * *Challenge:* Synchronously calling the Groq LLM API blocked FastAPI's event loop, causing the entire server to freeze for 5-15 seconds per request.
   * *Solution:* We moved the AI LLM pipeline into asynchronous executors (`run_in_threadpool`) and shifted video processing entirely to Celery workers.
2. **N+1 Database Queries in the History Endpoint**
   * *Challenge:* Fetching 50 sessions for an athlete resulted in 101 synchronous MongoDB queries, killing dashboard load times.
   * *Solution:* Re-wrote queries to use MongoDB `$in` batch aggregations, reducing 100+ queries to exactly 3 queries.
3. **Database Race Conditions & Lost Connections**
   * *Challenge:* Celery workers were dropping MySQL connections after being idle. `sys.exit()` calls in database utilities were killing the worker process entirely.
   * *Solution:* Implemented exponential backoff and retry policies using Celery's `autoretry_for`. Replaced `sys.exit()` with proper Python Exceptions (`ConnectionFailure`).
4. **WebSocket Authentication Vulnerabilities**
   * *Challenge:* Anyone could connect to a WebSocket progress channel if they guessed the `session_id`.
   * *Solution:* Implemented strict JWT token verification directly inside the WebSocket connection handshake.

---

## 🌟 Key Features

* **Role-Based Access Control (RBAC):** Distinct dashboards for Athletes vs. Coaches.
* **Live WebSockets:** Real-time progress bars for video analysis and real-time chat between coaches and athletes.
* **AI Biomechanics:** Detailed PDF reports and Groq-powered textual recommendations generated from uploaded sports footage.
* **Automated Notifications:** Cron-jobs (Celery Beat) automatically scan the database to find inactive athletes and send them reassessment reminders.
* **Rate Limiting:** IP-based protection using `slowapi` to prevent spam on auth and upload endpoints.

---

## 🐳 Docker Setup (Recommended)

The entire MoveIQ stack — API, Celery Worker, Celery Beat, Redis, Elasticsearch, and the Next.js frontend — can be started with a **single command** using Docker Compose.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Docker Architecture

Two custom Docker images are used:

| Image | Dockerfile | Used By |
|---|---|---|
| Backend | `Dockerfile` (root) | `api`, `worker`, `beat` containers — all share one image, different startup commands |
| Frontend | `frontend/Dockerfile` | `frontend` container — Next.js 3-stage build |

Plus two official images: `redis:7-alpine` and `elasticsearch:8.13.0`.

### Step 1 — Configure Environment

```bash
# Copy the Docker-specific env template
cp .env.docker .env.docker
```

Open `.env.docker` and fill in your real credentials (copy from `.env`). The **only values that must differ** from your regular `.env` are:

```env
# Use Docker service names, NOT localhost
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0
LOCAL_ELASTICSEARCH_URL=http://elasticsearch:9200
```

> **Note:** `.env.docker` is in `.gitignore` — your secrets will never be pushed to GitHub.

### Step 2 — Build & Start All Services

```bash
docker-compose up --build
```

This single command:
1. Builds the backend Python image (installs all `requirements.txt`)
2. Builds the frontend Next.js image (3-stage optimized build)
3. Pulls `redis:7-alpine` and `elasticsearch:8.13.0` official images
4. Starts all 6 containers in the correct order (Redis starts first, then workers)

### Step 3 — Verify Everything Is Running

| Service | URL |
|---|---|
| Next.js Frontend | http://localhost:3000 |
| FastAPI Backend | http://localhost:8000 |
| API Swagger Docs | http://localhost:8000/docs |
| Health Check | http://localhost:8000/api/health |
| Elasticsearch | http://localhost:9200 |
| Redis | localhost:6379 |

### Stop Everything

```bash
docker-compose down          # Stop containers (keeps data)
docker-compose down -v       # Stop containers AND wipe all volumes (fresh start)
```

### Named Volumes (Persistent Data)

| Volume | Purpose |
|---|---|
| `es_data` | Elasticsearch index data — persists across restarts |
| `temp_uploads` | Shared disk between `api` and `worker` for video file handoff |

---

## 🔧 Manual Setup (Without Docker)

If you prefer running services directly:

1. **Clone the repository**
2. **Create virtual environment:** `python -m venv venv && venv\Scripts\activate`
3. **Install requirements:** `pip install -r requirements.txt`
4. **Configure Environment:** Copy `.env.example` to `.env` and fill in your keys
5. **Start external services:** Ensure Redis, MongoDB, MySQL/PostgreSQL, and Elasticsearch are running locally
6. **Run the API:** `uvicorn api.server:app --reload --port 8000`
7. **Run the Celery Worker:** `celery -A src.worker.celery_app worker --loglevel=info -P threads`
8. **Run Celery Beat (Cron Jobs):** `celery -A src.worker.celery_app beat --loglevel=info`
9. **Run the Frontend:** `cd frontend && npm install && npm run dev`

---

## 🧪 Running Tests

```bash
# Run the full test suite (uses mock databases — no real DB needed)
pytest tests/ -v

# Run a specific test folder
pytest tests/unit/ -v
pytest tests/api_integration/ -v
pytest tests/worker/ -v
pytest tests/mocking/ -v
```

Test folders:

| Folder | Coverage |
|---|---|
| `tests/api_integration/` | FastAPI routes (auth, upload, login) |
| `tests/unit/` | Password hashing, MongoDB utilities |
| `tests/worker/` | Celery task logic (video processing, reminders) |
| `tests/mocking/` | Elasticsearch sync, Cloudinary upload |

---

## 🔄 Continuous Integration (CI)

MoveIQ uses **GitHub Actions** for automated testing to ensure code quality on every push.

### CI Pipeline Overview
Located at `.github/workflows/ci.yml`, the pipeline runs automatically on:
- Every `push` to any branch
- Every `pull_request` to any branch

### What the Pipeline Does
1. Boots up an isolated Ubuntu runner.
2. Checks out the repository code.
3. Sets up Python 3.11 with pip caching.
4. Installs strictly required OS-level dependencies (`libgl1` and `libglib2.0-0` for OpenCV and MediaPipe).
5. Installs all project dependencies from `requirements.txt`.
6. Executes the entire `pytest` suite.

This ensures that no broken code is merged into the `main` branch. The pipeline is designed to run the tests using isolated mock objects, meaning it requires zero external databases or API keys to successfully complete the CI workflow.