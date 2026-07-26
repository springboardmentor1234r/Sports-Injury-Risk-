# Milestone 3 — Injury Risk Prediction & Scoring

This folder is the **full app** — Milestone 1 + Milestone 2 + Milestone 3 — and is
identical to the complete project as submitted. Nothing was removed here; this is
the "everything built so far" snapshot.

## What's implemented here

Everything from Milestone 1 and Milestone 2 (auth/RBAC/profiles/video submission,
pose estimation, biomechanical analysis), plus:

- **Weighted injury-risk scoring engine** (`src/lib/injury-risk.ts`) — combines
  biomechanical deviations (35%), historical injury factors (20%), movement
  asymmetry (20%), training load (15%) and a fatigue trend across an athlete's
  analysis history (10%) into one 0–100 score, mapped to Low / Moderate / High /
  Critical.
- **Per-category risk breakdown** — ACL, hamstring, ankle sprain, shoulder, lower
  back, overuse — plus rule-based corrective recommendations, rendered by
  `src/components/injury-risk-card.tsx`.
- **Reports** (`/reports`) — team-wide, sortable by risk level, with per-athlete
  drill-down (coach / physiotherapist / sports scientist / administrator).
- **Athlete risk profile** — surfaced on the athlete's own `/analysis` page and on
  each athlete's detail page (`/athletes/$id`) for staff.

See the main `README.md`'s "Milestone 2" and "Milestone 3" sections for full
implementation notes and known limitations (e.g. the heuristic, threshold-based
nature of the scoring model vs. a trained ML classifier).

## Not yet implemented

Admin system metrics (`/system`) still render a placeholder — out of the original
Milestone 1–3 scope (see README "Current status").

## Setup

See the main `README.md` for install / environment / migration steps — this folder
includes every migration in filename order.
