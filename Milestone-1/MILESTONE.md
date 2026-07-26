# Milestone 1 — Project Initialization, Auth & Athlete Profile Management

This folder is a standalone snapshot of the app containing **only** Milestone 1 scope.
Pose estimation, biomechanical analysis and injury-risk scoring are intentionally
removed from this copy (they ship in the Milestone 2 and Milestone 3 folders) so this
can be evaluated on its own.

## What's implemented here

- Auth (sign up / sign in), role selection at signup
- Role-based access control across 5 roles: Athlete, Coach, Physiotherapist,
  Sports Scientist, Administrator (`src/lib/role-guard.tsx` client-side +
  Postgres Row-Level Security policies server-side)
- Athlete profile management: create, view, edit, delete, with injury history,
  training load, sport/position/anthropometrics (`src/components/athlete-form.tsx`,
  `src/routes/_authenticated/athletes*.tsx`)
- Video submission via link, with per-athlete history (`src/routes/_authenticated/upload.tsx`)
- Role-based dashboard with quick actions and simple counts (`src/routes/_authenticated/dashboard.tsx`)
- Injury history log for athletes, injury/case list for physiotherapists
  (`my-injuries.tsx`, `injuries.tsx`)
- User & system administration pages (`users.tsx`, `settings.tsx`)

## What's a placeholder here (by design)

`/analysis`, `/video-analysis`, and `/reports` render a "coming in a later milestone"
placeholder (`src/components/empty-page.tsx`) instead of 404ing, since the nav
already links to them for some roles. Full implementations are in the Milestone 2
and Milestone 3 folders.

## Setup

Same as the main project — see `README.md`. Apply the migrations in
`supabase/migrations/` in filename order; this folder only includes the migrations
needed for Milestone 1 (auth, profiles, athlete profiles, video submissions).
