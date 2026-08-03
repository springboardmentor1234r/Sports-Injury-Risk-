# Milestone 2 — What Changed

This zip is your actual `sports_injury` project (Milestone 1 code untouched
except where noted) with Milestone 2 added on top. `node_modules` and `.git`
were stripped to keep the zip small — run `npm install` again after
extracting, and your git history in your local `yasaswini_project` branch
is unaffected (this zip isn't a git repo).

## New files

| File | What it does |
|---|---|
| `backend/routes/video_routes.py` | Upload endpoint + status/pose/biomechanics GET endpoints |
| `backend/services/pose_estimation.py` | MediaPipe wrapper — extracts keypoints frame-by-frame |
| `backend/services/biomechanics.py` | Joint angles, ROM, knee valgus proxy, trunk lean, symmetry score |
| `frontend/src/pages/VideoAnalysis.jsx` | Upload form → polling → skeleton overlay → report cards, one self-contained page matching your `AthleteProfile.jsx` style |

## Modified files

| File | What changed |
|---|---|
| `backend/models.py` | Added `Video`, `PoseFrame`, `BiomechanicsReport` tables. `Video.athlete_id` correctly points at `athletes.athlete_id` (your PK), not `athletes.id`. |
| `backend/schemas.py` | Added `VideoOut`, `PoseFrameOut`, `BiomechanicsReportOut` |
| `backend/main.py` | Registered `video_router`, mounted `/uploads` as static so `<video src="...">` can play the uploaded file, added `import models` so the new tables get created by `Base.metadata.create_all()` |
| `frontend/src/App.jsx` | Added the `/video-analysis` route |
| `frontend/src/pages/Dashboard.jsx` | Unlocked the "Video Upload" card (was "Coming Soon 🔒") — it now navigates to `/video-analysis` |

## Design decisions specific to your codebase

- **No `athlete_id` passed around manually.** Your app already ties one
  `Athlete` profile to one logged-in `User` (see `athelete_routes.py`).
  Video upload/list follows the same pattern — it looks up *your own*
  athlete profile from the JWT automatically. If you later add
  coach/physio views of *other* athletes' videos, that's a small addition
  (a query param + a role check), not a redesign.
- **Reused your existing `get_current_user`** from `athelete_routes.py`
  instead of writing a second one — it returns `user_id`, so
  `video_routes.py` looks up the `Athlete` row itself.
- **Flat imports, no `app/` package** — matches `database.py` / `models.py`
  / `schemas.py` living directly in `backend/`.
- **String columns instead of SQLAlchemy `Enum`** for `status` and
  `activity_type` on `Video`, matching how `role` is a plain `String` on
  `User` rather than an enum type.

## Setup steps

```bash
cd backend
pip install mediapipe opencv-python numpy python-multipart
```
(`python-multipart` is required by FastAPI for `UploadFile`/`Form` — you
likely don't have it yet since Milestone 1 didn't upload files.)

```bash
cd frontend
npm install
```

Then just run both servers as usual:
```bash
# backend
uvicorn main:app --reload

# frontend
npm run dev
```

Tables are created automatically on backend startup via
`Base.metadata.create_all(bind=engine)` in `main.py` — no manual SQL needed,
same as your Milestone 1 tables.

## Test it

1. Log in, go to Dashboard, click the now-unlocked "Video Upload" card.
2. Upload a short (5–10s) clip — a phone video of a squat or running stride,
   side-on angle, full body in frame, works best.
3. Watch it flip from "Processing…" to the skeleton overlay + report cards.

If `/videos/upload` 400s with "Create your athlete profile first" — that's
correct behavior, not a bug: go fill in `/profile` first (Milestone 1 flow),
then retry the upload.

## Known limitations (worth a line in your report)

- **2D single-camera pose estimation** can't give clinically precise knee
  valgus or 3D joint angles. The metrics here are useful relative/trend
  indicators (asymmetry, week-over-week change), not clinical measurements —
  said explicitly in the docstring of `biomechanics.py` too.
- **BackgroundTasks**, not a task queue — fine for a solo dev/demo project,
  worth naming as a Milestone 4 scaling item rather than something to fix now.
- Frames with occluded/out-of-view joints are skipped rather than crashing,
  but very short/messy clips will produce sparse reports.

---

## Role-based dashboards (Coach / Physiotherapist / Sports Scientist / Admin)

Pulled forward from your PDF's Milestone 4 ("Dashboard & Analytics"
section) since you wanted role-specific views now rather than everyone
sharing the athlete dashboard.

### New backend pieces
- **`models.py`** — added `AthleteAssignment` (links a staff `user_id` to
  an `athlete_id` — this is the "who can see whom" table)
- **`auth.py`** — added `get_current_user_and_role()`, since staff/admin
  routes need to check the role, not just who's logged in
- **`schemas.py`** — added `UserOut`, `AthleteWithOwnerOut`,
  `AssignmentCreate`, `AssignmentOut`
- **`routes/staff_routes.py`** (new) — `/staff/my-athletes`,
  `/staff/athlete/{id}`, `/staff/athlete/{id}/videos`,
  `/staff/athlete/{id}/videos/{video_id}/pose-frames`,
  `/staff/athlete/{id}/videos/{video_id}/biomechanics` — all scoped so a
  coach/physio/sports scientist can only see athletes explicitly assigned
  to them; admins bypass this check
- **`routes/admin_routes.py`** (new) — `/admin/users`, `/admin/athletes`,
  `/admin/assignments`, `POST /admin/assign`, `DELETE /admin/assign/{id}`
- **`main.py`** — registered both new routers

### New/modified frontend pieces
- **`Login.jsx`** — now redirects by role after login: athlete → `/dashboard`,
  admin → `/admin-dashboard`, everyone else (coach/physio/sports_scientist) →
  `/staff-dashboard`
- **`Dashboard.jsx`** — added a safety-net redirect so a non-athlete landing
  here (bookmark, back button) gets bounced to their real dashboard
- **`StaffDashboard.jsx`** (new) — coach/physio/sports scientist see only
  their assigned athletes as cards, click through to detail view
- **`AdminDashboard.jsx`** (new) — lists all users and athletes, has a form
  to assign an athlete to a staff member, and a list of current assignments
  with a remove button
- **`AthleteDetail.jsx`** (new) — read-only view for staff/admin: athlete's
  profile info + their uploaded videos + the same skeleton-overlay/report
  view athletes see for their own videos, just without an upload button
- **`App.jsx`** — added routes: `/staff-dashboard`, `/admin-dashboard`,
  `/athlete-detail/:athleteId`

### How to actually use it
1. Register a few test users with different roles via `/register`
   (role field: `athlete`, `coach`, `physiotherapist`, `sports_scientist`,
   or `admin`)
2. Log in as the `admin` account → lands on Admin Dashboard
3. Use the "Assign Athlete to Staff" form to link a coach/physio/sports
   scientist to one or more athletes
4. Log out, log in as that coach/physio account → lands on their Staff
   Dashboard showing only their assigned athletes
5. Click an athlete card → see their profile + video history read-only

### Known gap to flag in your report
There's currently no UI for a coach to *request* access to an athlete —
only admins can create assignments. That matches how you said this should
work ("coaches only see athletes assigned to them"), but if you want
self-service requests later (coach searches for an athlete and requests
access, admin approves), that's a small addition on top of this — not a
redesign.

---

## Milestone 3 — Injury Prediction & Recommendations

Covers PDF sections 6–9 (Injury Risk Prediction Engine, Movement Anomaly
Detection Engine, Risk Scoring Engine, Corrective Recommendation Engine)
plus the athlete-facing half of section 10 (Dashboard & Analytics),
chained directly onto the Milestone 2 pose/biomechanics pipeline.

### New backend pieces
- **`models.py`** — added `InjuryRiskAssessment` (one row per processed
  video: the 5 weighted sub-scores, overall risk score/category,
  per-injury-type risk breakdown, detected anomalies, and recommendations)
- **`services/injury_risk.py`** (new) — the actual engine:
  - `detect_movement_anomalies()` — movement deviation detection (frame
    outliers vs. the clip's own baseline), motion inconsistency analysis
    (variance), fatigue-related movement monitoring (first-half vs.
    second-half degradation), and performance decline detection (shrinking
    knee ROM)
  - the Weighted Scoring Model exactly as specified in the PDF:
    Biomechanical Deviations 35% + Historical Injury Factors 20% +
    Movement Asymmetry 20% + Training Load Indicators 15% + Fatigue
    Indicators 10%, mapped to Low / Moderate / High / Critical
  - per-injury-type risk estimates for all 6 categories from the PDF (ACL,
    Hamstring, Ankle Sprain, Shoulder, Lower Back, Overuse)
  - the corrective recommendation engine (exercise / mobility /
    strengthening / recovery / training-modification suggestions, rule-based
    off the risk factors actually triggered)
- **`routes/video_routes.py`** — `process_video_task` now chains the risk
  engine on right after the Milestone 2 biomechanics report (wrapped in its
  own try/except so a risk-engine hiccup never takes down the video's
  biomechanics results); added `GET /videos/{id}/risk-assessment` and
  `GET /videos/risk/overview` (athlete's own risk history/trend)
- **`routes/staff_routes.py`** — added
  `GET /staff/athlete/{id}/videos/{video_id}/risk-assessment` and
  `GET /staff/team-risk-overview` (Coach Dashboard "Team risk overview")
- **`schemas.py`** — added `InjuryRiskAssessmentOut`, `VideoRiskSummary`,
  `AthleteRiskOverviewOut`, `TeamRiskOverviewItem`

### New/modified frontend pieces
- **`lib/risk.js`** (new) — shared risk-category colors, recommendation
  icons/labels, and the weighted sub-score field list, reused across every
  page below
- **`InjuryRiskDashboard.jsx`** (new) — the athlete's injury-risk dashboard:
  overall risk score/category, the 5 weighted sub-score bars, per-injury-type
  breakdown, detected anomalies, recommendations, and a click-to-expand
  history of past videos
- **`VideoAnalysis.jsx`** — the old ad-hoc `getRiskVerdict()` heuristic (a
  few if/else rules living only in the frontend) is gone; it now fetches
  and renders the real backend `InjuryRiskAssessment` for the video
  (sub-scores, injury-type breakdown, anomalies, recommendations)
- **`AthleteDetail.jsx`** — same replacement for the staff-facing view
- **`StaffDashboard.jsx`** — each athlete card now shows a small risk badge
  (category + score) pulled from `/staff/team-risk-overview`
- **`Dashboard.jsx`** — unlocked the "Injury Risk" card (was "Coming in
  Milestone 3") — it now navigates to `/injury-risk`
- **`App.jsx`** — added the `/injury-risk` route

### Design decisions specific to your codebase
- **No new DB migration step needed.** `InjuryRiskAssessment` is just
  another class in `models.py`, and `main.py` already does
  `import models` + `Base.metadata.create_all(bind=engine)` — the new
  `injury_risk_assessments` table gets created automatically on next
  backend startup, same as every other table so far.
- **Risk generation is best-effort, not a hard dependency.** If the risk
  engine throws for any reason, the video still finishes at `status =
  "completed"` with its Milestone 2 biomechanics report — the frontend
  pages simply skip rendering the risk card if `/risk-assessment` 404s.
  This matches how Milestone 2 already treats pose/biomechanics frame
  skipping (fail soft, not hard).
- **No new npm dependency.** The dashboards use plain styled `<div>` bars
  instead of a charting library, since `package.json` doesn't have one yet
  (recharts/Chart.js etc.) — consistent with keeping the stack as-is.

### Known limitations (worth a line in your report, same spirit as Milestone 2's)
- This is a **rule-based/heuristic screening model**, not a trained
  classifier — same honesty note as `biomechanics.py`. A production version
  would train on the datasets the PDF recommends (Human3.6M, MPII, COCO,
  SportsPose, FIFA Injury Dataset) instead of the hand-tuned weights in
  `injury_risk.py`.
- `historical_injury_score` and `training_load_score` are derived from the
  free-text `injury_history` / `training_load` fields on the athlete
  profile (Milestone 1) — there's no structured injury-log or
  training-load-tracking UI yet, so these are coarse keyword/heuristic
  reads rather than a real time series.
- Per-injury-type risk (ACL/Hamstring/Ankle/Shoulder/Lower Back/Overuse) is
  estimated from the same 2D single-camera proxies Milestone 2 already
  flagged as non-clinical — treat the six numbers as relative
  screening signals, not diagnoses.

### Test it
1. Upload a video (or reuse one from Milestone 2) and let it finish
   processing.
2. From the athlete Dashboard, click the now-unlocked "Injury Risk" card —
   you'll see the overall score, the 5 weighted sub-scores, the 6
   injury-category risks, any detected anomalies, and recommendations.
3. Open that same video from `/video-analysis` — the risk card now shows
   there too, replacing the old "Final Assessment" heuristic box.
4. Log in as a coach/physio/sports_scientist → their Staff Dashboard now
   shows a risk badge per athlete, and opening an athlete's video shows the
   same full risk breakdown staff-side.

---

## Milestone 4 — Analytics, Testing & Deployment

Covers PDF sections 10 (the remaining "executive dashboard" panels — Admin
Dashboard, Sports Scientist Dashboard, Physiotherapist Dashboard), 11
(Notification & Alert System), 12 (Reports & Export System), and 13
(Final Integration, Testing & Deployment).

### New backend pieces
- **`models.py`** — added `Notification` (one row per alert: type,
  severity, title, message, read/unread, which video/athlete it's about)
- **`services/notifications.py`** (new) — `generate_notifications_for_risk_assessment()`,
  called right after the Milestone 3 risk engine finishes. Covers all 5
  PDF section 11 bullets: assessment-completion alerts (always), high-risk
  movement / injury risk alerts (High or Critical category), training
  load warnings (`training_load_score > 70`), and recovery reminders
  (when the anomaly engine flagged fatigue). Notifications go to the
  athlete who owns the video — coaches/physios already get the same
  signal via the Milestone 4 analytics panels, so this avoids duplicating
  every alert across every assigned staff member.
- **`services/reports.py`** (new) — PDF generation (reportlab) and Excel
  generation (openpyxl) for the report types PDF section 12 lists: a
  per-video report (biomechanical assessment + injury risk + movement
  anomalies + recommendations) and an athlete performance report
  (summary + full risk history) in both formats.
- **`routes/report_routes.py`** (new) — `GET /reports/videos/{id}/pdf`,
  `GET /reports/athlete/me/pdf`, `GET /reports/athlete/me/excel` (athlete
  self-service), plus `GET /reports/staff/athlete/{id}/pdf` and
  `/excel` (staff/admin, reusing `staff_routes.py`'s `_verify_access` so
  the same assignment rules apply to report downloads as everything else).
- **`routes/notification_routes.py`** (new) — `GET /notifications/`,
  `GET /notifications/unread-count`, `POST /notifications/{id}/read`,
  `POST /notifications/read-all`.
- **`routes/admin_routes.py`** — added `GET /admin/platform-analytics`
  (user/athlete/video counts, risk category distribution, avg risk score)
  and `GET /admin/system-monitoring` (DB connectivity, videos
  processing/failed, pose frames tracked) — PDF's "Admin Dashboard:
  Platform analytics / System monitoring".
- **`routes/staff_routes.py`** — added `GET /staff/analytics-overview`:
  aggregated team stats (avg risk score, risk category distribution, avg
  movement quality / knee valgus / trunk lean, most common anomaly types)
  across a coach/physio/sports-scientist's assigned athletes — feeds the
  Sports Scientist Dashboard ("Biomechanical analytics", "Injury
  prediction insights") and Physiotherapist Dashboard ("Injury risk
  monitoring", "Movement correction analytics") from PDF section 10.
- **`main.py`** — CORS origins are now configurable via a `CORS_ORIGINS`
  env var (comma-separated), instead of hardcoded `localhost` only —
  needed the moment this is deployed anywhere but a dev machine. Unset,
  it behaves exactly as before.
- **`requirements.txt`** (new) — this didn't exist before Milestone 4;
  reconstructed from every `import` actually used across the codebase, so
  `pip install -r requirements.txt` now works from a clean checkout.
- **`tests/`** (new) — 19 pytest tests across `test_biomechanics.py` (6),
  `test_injury_risk.py` (7), and `test_reports.py` (6). All pure-function
  tests against `services/*.py` directly — no database or FastAPI app
  needed, so they run in under a second and don't need Postgres
  configured to work in CI.

### New/modified frontend pieces
- **`lib/config.js`** (new) — every page had its own
  `const API_BASE = "http://localhost:8000"` (or, in 3 files, the URL
  hardcoded inline into each axios call) — that's now one shared
  `API_BASE` read from `VITE_API_BASE` at build time, falling back to the
  same `localhost:8000` so local dev is unaffected. This was a real gap:
  without it, the frontend Docker image would only ever work pointed at
  `localhost:8000`, no matter where it's deployed. Updated across all 8
  files that referenced it (`Login`, `Register`, `AthleteProfile`,
  `Dashboard` doesn't call the API directly, `AdminDashboard`,
  `AthleteDetail`, `InjuryRiskDashboard`, `StaffDashboard`,
  `VideoAnalysis`).
- **`lib/download.js`** (new) — shared helper for authenticated file
  downloads (the report endpoints need an `Authorization` header, so a
  plain `<a href>` won't work — fetches as a blob and triggers the
  browser's save dialog via a temporary anchor).
- **`components/NotificationBell.jsx`** (new) — self-contained dropdown:
  unread badge, list, mark-one-read, mark-all-read, polls every 30s.
  Wired into `Dashboard.jsx`'s topbar, replacing a `🔔` icon that was
  already there with a hardcoded fake "3" badge and no click handler —
  it's real now. Also removed the same hardcoded "3" from the sidebar nav
  item.
- **`InjuryRiskDashboard.jsx`** — added "PDF Report" / "Excel Report"
  buttons (athlete's full performance report) plus a per-video "Download
  this video's PDF" button inside each history row's expand panel.
- **`AthleteDetail.jsx`** — same PDF/Excel report buttons, staff-side
  (hits the `/reports/staff/athlete/{id}/...` endpoints instead).
- **`StaffDashboard.jsx`** — added the analytics panel described above,
  with the title/icon changing per role (`ANALYTICS_PANEL_INFO`) even
  though all three roles currently read from the same
  `/staff/analytics-overview` payload — the underlying data is genuinely
  the same aggregate stats, just framed differently per the PDF's
  dashboard descriptions.
- **`AdminDashboard.jsx`** — added Platform Analytics (stat cards +
  users-by-role / videos-by-status / risk-category breakdowns), System
  Monitoring (status, DB connectivity, processing/failed counts), and a
  Report Management panel (pick any athlete, download their PDF or Excel
  report — this is the "generate a report for any athlete" admin
  capability the PDF's "Report management" bullet implies).

### Design decisions specific to your codebase
- **No new DB migration step needed**, same as Milestone 3 — `Notification`
  is just another class in `models.py`, picked up automatically by
  `Base.metadata.create_all(bind=engine)` in `main.py`.
- **Notification generation is best-effort**, wrapped in its own
  try/except inside the same block as the Milestone 3 risk engine — a
  notification failure never affects the video/biomechanics/risk data
  that's already been saved.
- **Report generation is on-demand, not pre-stored.** There's no
  "generated reports" table — PDFs/Excel files are built fresh on each
  request and streamed back. Simpler, and avoids stale reports; the
  tradeoff is regenerating the same report costs a little CPU each time,
  which is fine at this scale.
- **Reused your existing access-control helpers exactly as written**
  (`_verify_access`, `_require_staff_or_admin` from `staff_routes.py`,
  `_get_own_athlete` from `video_routes.py`) for every new report/
  notification endpoint, rather than writing parallel logic — so a
  physio who can see an athlete's videos can download that athlete's
  reports, and no one else can, automatically.
- **Found and fixed one pre-existing ESLint issue** in `AdminDashboard.jsx`
  (`loadAll` referenced before its declaration) while I was already
  editing that file for the `API_BASE` change — moving the declaration
  surfaced a *second*, stricter lint rule about calling component-scope
  functions from inside `useEffect` (`react-hooks/set-state-in-effect`).
  That second one is a pre-existing characteristic of this Milestone 1
  code's data-loading pattern (not something Milestone 4 touches), so I
  reverted back to the original declaration order rather than restructure
  working code outside this milestone's scope. `npx eslint src/` still
  reports that one pre-existing error — it's not new, and it's not a
  runtime bug (React defers effects until after the component body
  finishes executing, so `loadAll` is always defined by the time the
  effect actually calls it).

### Known limitations (worth a line in your report)
- Notifications currently only reach the athlete who owns the video —
  coaches/physios/sports scientists don't get a personal notification
  feed yet, they see the same signal via the analytics panels instead.
  A "notify assigned staff too" mode would be a small addition on top of
  `generate_notifications_for_risk_assessment()` if you want it later.
- Reports render from live data at request time — there's no history of
  "reports generated" for audit purposes. Fine for this platform's scope;
  would need a `GeneratedReport` table if that mattered.
- `backend/uploads/videos` is local disk storage, not S3/Blob — noted in
  `DEPLOYMENT.md` as a follow-up for scaling past one backend instance.
- I ran the 19 pytest tests manually (calling each test function directly
  in Python) since `pytest` itself isn't installed in my sandbox — they're
  written as standard pytest test files and will run normally with
  `pytest tests/ -v` in your environment; I don't have a way to verify
  the actual `pytest` CLI output here, only that the same assertions pass
  when executed directly.
- Docker builds weren't run end-to-end (no Docker daemon in my sandbox) —
  I reviewed both Dockerfiles carefully and they follow standard,
  well-tested patterns (slim Python + the usual opencv/mediapipe system
  libs; multi-stage Node build → nginx for the frontend), but please run
  `docker compose up --build` yourself before considering deployment done.

### Test it
1. `cd backend && pip install -r requirements.txt && pytest tests/ -v` —
   19 tests should pass.
2. Upload and analyze a video as an athlete → check the browser for a
   real-time notification badge appearing on the 🔔 icon in the Dashboard
   topbar; click it to see the alert(s) generated.
3. From the Injury Risk Dashboard, download both the PDF and Excel
   reports — open them to confirm they render correctly.
4. Log in as a coach/physio/sports_scientist → Staff Dashboard now shows
   an analytics panel above the athlete grid.
5. Log in as admin → Admin Dashboard now shows Platform Analytics, System
   Monitoring, and a Report Management panel that can generate a report
   for any athlete on the platform.
6. `docker compose up --build` from the project root (after copying
   `.env.example` to `.env`) to test the full containerized stack.
