# Milestone 3 — Injury Risk Prediction, Scoring & Recommendations

This folder contains **Milestone 1 + Milestone 2 + Milestone 3** scope. Analytics
dashboards, notification/alerts, and the report-export system are Milestone 4 scope
and are intentionally removed from this copy.

This is a refreshed snapshot, rebuilt on the current verified codebase, and includes
a real addition beyond the previous upload: a full **corrective recommendation
engine**, which per the project spec's Milestone 3 tasks ("Generate corrective
recommendations... Recommendation workflows completed") belongs here rather than in
Milestone 4.

## What's implemented here

Everything from Milestone 1 and Milestone 2 (auth/RBAC/profiles/video submission,
pose estimation, biomechanical analysis), plus:

- **Weighted injury-risk scoring engine** (`src/lib/injury-risk.ts`) — combines
  biomechanical deviations (35%), historical injury factors (20%), movement
  asymmetry (20%), training load (15%) and a fatigue trend across an athlete's
  analysis history (10%) into one 0–100 score, mapped to Low / Moderate / High /
  Critical.
- **Per-category risk breakdown** — ACL, hamstring, ankle sprain, shoulder, lower
  back, overuse — rendered by `src/components/injury-risk-card.tsx`.
- **Corrective recommendation engine** (`src/lib/corrective-recommendations.ts`) —
  turns the risk profile into a structured program across the five areas the spec
  calls out: exercise recommendations, mobility improvement, strengthening,
  recovery planning, and training modification suggestions. Each item names the
  specific finding that triggered it. Rendered by
  `src/components/corrective-program-card.tsx`, shown alongside the risk card on
  an athlete's own `/analysis` page and on their staff-facing `/athletes/$id` page.
- **Reports** (`/reports`) — team-wide, sortable by risk level, with per-athlete
  drill-down (coach / physiotherapist / sports scientist / administrator).

## What's a placeholder here (by design)

Analytics dashboards (`/analytics`), the notification/alert system, and the
multi-format report builder (`/report-builder`) are Milestone 4 scope and aren't
present in this folder.

## Known limitation (unchanged from the main README)

The scoring model is a transparent, threshold-based rubric, not a trained ML
classifier — there's no labeled injury-outcome dataset available yet to train one
against. Structured injury logging (already in place) is the intended path toward
that.

## Setup

Same as the main project — see `README.md`. Copy `.env.example` to `.env` and fill
in your own Supabase project's values. Apply the migrations in
`supabase/migrations/` in filename order.

Verified before upload: `npx tsc --noEmit` (clean) and `npx vite build` (clean),
against a fresh `npm install`.
