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
