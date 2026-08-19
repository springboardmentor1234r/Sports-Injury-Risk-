# Milestone 1 — Project Initialization, Auth & Athlete Profile Management

This folder is a standalone snapshot of the app containing **only** Milestone 1 scope.
Pose estimation, biomechanical analysis, injury-risk scoring and the corrective
recommendation engine are intentionally removed from this copy (they ship in the
Milestone 2 and Milestone 3 folders) so this can be evaluated on its own.

This is a refreshed snapshot: it's rebuilt on top of the current, verified codebase
(new Supabase project, full GitHub + Google OAuth sign-in, and an athlete-staff
directory used when assigning a coach/physio to an athlete), not a re-upload of an
older copy.

## What's implemented here

- Auth (sign up / sign in, plus GitHub and Google OAuth), role selection at signup
- Role-based access control across 5 roles: Athlete, Coach, Physiotherapist,
  Sports Scientist, Administrator (`src/lib/role-guard.tsx` client-side +
  Postgres Row-Level Security policies server-side)
- Athlete profile management: create, view, edit, delete, with injury history,
  training load, sport/position/anthropometrics, and assigning a coach/physio
  from the staff directory (`src/components/athlete-form.tsx`,
  `src/lib/staff-directory.ts`, `src/routes/_authenticated/athletes*.tsx`)
- Video submission via link, with per-athlete history (`src/routes/_authenticated/upload.tsx`)
- Role-based dashboard with quick actions and simple counts (`src/routes/_authenticated/dashboard.tsx`)
- Injury history log for athletes, injury/case list for physiotherapists
  (`my-injuries.tsx`, `injuries.tsx`)
- User & system administration pages (`users.tsx`, `settings.tsx`)

## What's a placeholder here (by design)

`/analysis`, `/video-analysis`, and `/reports` render a "coming in a later milestone"
placeholder instead of 404ing, since the nav already links to them for some roles.
Full implementations are in the Milestone 2 and Milestone 3 folders. Training-load
alerts and analytics dashboards are Milestone 4 scope and aren't referenced here.

## Setup

Same as the main project — see `README.md`. Copy `.env.example` to `.env` and fill
in your own Supabase project's values. Apply the migrations in
`supabase/migrations/` in filename order.

Verified before upload: `npx tsc --noEmit` (clean) and `npx vite build` (clean),
against a fresh `npm install`.
