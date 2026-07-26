# Milestone 2 — Pose Estimation & Biomechanical Analysis

This folder is a standalone snapshot of the app containing **Milestone 1 + Milestone 2**
scope. Injury-risk scoring (Milestone 3) is intentionally removed from this copy so
this milestone can be evaluated on its own.

## What's implemented here

Everything from Milestone 1 (auth, RBAC, athlete profiles, video submission), plus:

- **Pose estimation** — client-side, in-browser, using MediaPipe Tasks Vision
  (BlazePose/WASM). See `src/lib/pose-estimation.ts`.
- **Biomechanical analysis engine** — pure functions turning pose landmarks into
  joint angles (knee/hip/elbow flexion, trunk lean, a frontal-plane knee-alignment
  proxy), range of motion, left/right symmetry, and a 0–100 movement quality score
  plus rule-based risk flags. See `src/lib/biomechanics.ts`.
- **Video Analysis workspace** (sports scientist / admin) — run analysis on a
  submitted video, view the biomechanics report. See
  `src/routes/_authenticated/video-analysis.tsx`.
- **Athlete-facing results** — an athlete's own per-video biomechanics reports on
  `/analysis`. See `src/routes/_authenticated/analysis.tsx` and
  `src/components/biomechanics-report.tsx`.
- Results are persisted in the `pose_analyses` table (see the Milestone 2 migration),
  one row per video submission, upserted on re-run.

**Important limitation carried over from the full app:** the browser can only read
pixel data out of a direct video file (`.mp4`/`.webm`/`.mov`) it controls — not an
embedded YouTube/Vimeo/Drive preview. `/video-analysis` only offers "Run analysis"
for submissions whose link resolves to a direct file.

## What's a placeholder here (by design)

`/reports` renders a "ships in Milestone 3" placeholder — the weighted injury-risk
scoring model (ACL/hamstring/ankle/shoulder/lower-back risk, training-load and
history weighting, corrective recommendations) is Milestone 3 scope and lives in
that folder.

## Setup

Same as the main project — see `README.md`. Apply the migrations in
`supabase/migrations/` in filename order; this folder includes the Milestone 2
`pose_analyses` migration and the staff-view-profiles fix it depends on.
