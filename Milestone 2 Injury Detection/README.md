# Sports Injury Risk Detection — Milestones 1 & 2

**Milestone 1 — Project Initialization, Design Process & Core Setup**
- ✅ User registration & login (JWT auth)
- ✅ Role-based access control (Athlete, Coach, Physiotherapist, Sports Scientist, Administrator)
- ✅ Athlete profile management (CRUD, injury history)
- ✅ Working React frontend with dashboards per role
- ✅ SQLite by default — **zero database setup required.** Swap in Postgres later with one env variable.

**Milestone 2 — Pose Estimation & Biomechanical Analysis**
- ✅ Upload a photo → MediaPipe Pose extracts 33 body keypoints
- ✅ Computes joint angles: knees, hips, elbows, trunk lean
- ✅ Computes left/right asymmetry (a known proxy for injury risk) with threshold-based flags
- ✅ Annotated skeleton image saved and displayed in the browser
- ✅ Full analysis history per athlete, viewable by the athlete or by staff roles

Injury *prediction* (a trained risk model, not just threshold heuristics) is Milestone 3 —
not part of this codebase yet.

---

## Folder structure

```
sports-injury-platform/
├── backend/           FastAPI + SQLAlchemy + JWT auth
│   ├── app/
│   │   ├── main.py            entrypoint
│   │   ├── config.py          settings (reads .env)
│   │   ├── database.py        SQLAlchemy engine/session
│   │   ├── models.py          User, AthleteProfile, InjuryRecord
│   │   ├── schemas.py         Pydantic request/response models
│   │   ├── security.py        password hashing + JWT
│   │   ├── dependencies.py    get_current_user + require_roles()
│   │   └── routers/
│   │       ├── auth.py        /api/auth/register, /login, /me
│   │       └── athletes.py    /api/athletes/... (profile + injuries)
│   ├── requirements.txt
│   └── .env.example
└── frontend/           React (Vite) + React Router + Axios
    └── src/
        ├── pages/      Login, Register, Dashboard, AthleteProfile, AthleteDetail
        ├── context/    AuthContext (JWT session handling)
        ├── components/ Navbar, ProtectedRoute
        └── api.js       Axios instance pointed at http://localhost:8000/api
```

---

## Prerequisites

Install these once, if you don't already have them:
- **Python 3.10+** — check with `python3 --version`
- **Node.js 18+** (includes npm) — check with `node --version`
- **VS Code** with the "Python" extension (optional but recommended)

No PostgreSQL, Docker, or cloud account needed for this milestone — the backend uses a local
SQLite file (`sports_injury.db`) created automatically on first run.

---

## 1. Run the backend (FastAPI)

Open a terminal in VS Code (`` Ctrl+` `` / `` Cmd+` ``) and run:

```bash
cd backend

# Create an isolated virtual environment (recommended)
python3 -m venv venv

# Activate it:
source venv/bin/activate        # macOS / Linux
venv\Scripts\activate           # Windows (cmd/PowerShell)

# Install dependencies
pip install -r requirements.txt

# Create your local env file (defaults are already fine)
cp .env.example .env            # macOS/Linux
copy .env.example .env          # Windows

# Start the API with auto-reload
uvicorn app.main:app --reload --port 8000
```

You should see `Uvicorn running on http://127.0.0.1:8000`.

Open **http://localhost:8000/docs** — this is the auto-generated Swagger UI where you can
test every endpoint (register, login, profile CRUD) directly, with no frontend needed.

> Tip: In VS Code, select this `venv` as your Python interpreter
> (bottom-right corner, or `Ctrl+Shift+P` → "Python: Select Interpreter") so
> imports resolve correctly and you get IntelliSense.

---

## 2. Run the frontend (React + Vite)

Open a **second terminal** (keep the backend running in the first one):

```bash
cd frontend
npm install
npm run dev
```

Vite will print a local URL — open **http://localhost:5173**.

---

## 2b. Milestone 2 dependency notes (pose estimation)

`pip install -r requirements.txt` now also installs `mediapipe`, `opencv-python`, and `numpy`.
A few things to know:

- **First install may take a minute or two** — mediapipe is a larger package.
- **Python version:** mediapipe works reliably on Python 3.9–3.11. If you're on Python 3.12+
  and installation fails, install Python 3.11 and recreate your venv with
  `python3.11 -m venv venv`.
- Annotated images are saved to `backend/uploads/` (auto-created, git-ignored) and served at
  `http://localhost:8000/uploads/<filename>.jpg`.

---

## 3. Try it out

1. Go to http://localhost:5173/register
2. Create an account as role **Athlete** — fill in name/email/password.
3. You'll land on the dashboard. Click **Edit Profile** and fill in sport, position, age, etc.
4. Log out, register a second account as role **Coach** (or Physiotherapist / Sports Scientist / Administrator).
5. Logging in as that staff role shows a **Team Overview** table of all athletes — click
   "View profile" on your first athlete to see the role-based access in action
   (an athlete can only edit their own profile; staff roles can view everyone's).
6. As the athlete, click **Motion Analysis**, upload a clear full-body photo (standing pose,
   whole body visible works best), and click **Run Analysis**. You'll see the annotated
   skeleton, computed joint angles, and any asymmetry flags. Run it a few times to build up
   history.
7. As the coach/staff account, open an athlete's profile and click **Motion Analysis** there
   too — staff can run or review analyses for any athlete on the roster.

---

## Switching to PostgreSQL later (optional, for Milestone 2+)

1. Install PostgreSQL locally or use a hosted instance.
2. Create a database, e.g. `sports_injury`.
3. In `backend/.env`, change:
   ```
   DATABASE_URL=postgresql://<user>:<password>@localhost:5432/sports_injury
   ```
4. Install the driver: `pip install psycopg2-binary`
5. Restart the backend — tables are created automatically on startup.

---

## Common issues

| Problem | Fix |
|---|---|
| `ModuleNotFoundError` when running uvicorn | Make sure the venv is activated and you ran `pip install -r requirements.txt` from inside `backend/` |
| Frontend shows network errors / CORS errors | Make sure the backend is running on port 8000 first, then start the frontend |
| `npm install` fails on an old Node version | Update Node.js to 18+ from nodejs.org |
| Port 8000 or 5173 already in use | Stop whatever else is using it, or run `uvicorn app.main:app --reload --port 8001` and update `frontend/src/api.js` baseURL to match |
| Login says "Invalid email or password" | Double check you registered that email first — registration and login are separate steps |

---

## What's next (Milestones 3–4, not in this codebase yet)

- Milestone 3: Trained injury-risk prediction model, movement anomaly detection over time,
  corrective-exercise recommendations
- Milestone 4: Full analytics dashboards, Docker containerization, cloud deployment
