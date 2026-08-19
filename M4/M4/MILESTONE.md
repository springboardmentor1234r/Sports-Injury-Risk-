# Milestone 4 — Analytics, Testing & Deployment

This folder is the **full app** — Milestone 1 + Milestone 2 + Milestone 3 +
Milestone 4 — and is identical to the complete project as submitted ("Entire
Project" in this same upload). Nothing is removed here; this is the "everything
built so far" snapshot.

## What's implemented here

Everything from Milestones 1–3 (auth/RBAC/profiles/video submission, pose
estimation, biomechanical analysis, injury-risk scoring, corrective
recommendations), plus:

- **Analytics dashboards** (`/analytics`) — platform-wide and team-level trends,
  built on `src/lib/analytics-data.ts` and `src/components/analytics-charts.tsx`.
- **Notification & alert system** (`/alerts`) — training-load and risk alerts,
  raised automatically when an athlete's training load is edited up or a risk
  threshold is crossed. See `src/lib/alerts.ts`.
- **Report builder** (`/report-builder`) — generates PDF, Excel, and CSV exports
  per athlete or across a squad. See `src/lib/report-export.ts`.
- **Automated tests** — Vitest coverage on the risk-scoring engine and analytics
  aggregation, including edge cases like missing data and single-analysis
  athletes (`src/lib/__tests__/`).
- **Docker containerization** — `Dockerfile` and `docker-compose.yml` for a
  reproducible deployment.

## Setup

See the main `README.md` for install / environment / migration steps. Copy
`.env.example` to `.env` and fill in your own Supabase project's values — this
folder includes every migration in filename order.

Verified before upload, from a completely fresh install: `npx tsc --noEmit`
(clean), `npx vite build` (clean), and `npx vitest run` (14/14 tests passing).
