# KinetIQ — AI Sports Injury Risk Detection from Video

KinetIQ turns athlete movement videos into biomechanical metrics, an injury risk
score, and role-specific reports for athletes, coaches, physiotherapists, sports
scientists and administrators.

## Features

- **Role-based access** — five roles with tailored navigation, dashboards and strict data visibility.
- **Athlete registry** — full athlete profiles, injury history and medical conditions.
- **Video submissions** — athletes submit movement videos for review.
- **Pose estimation & biomechanics** — joint angles, range of motion, trunk lean, knee valgus and left/right symmetry.
- **Injury risk scoring** — weighted composite: biomechanical deviation 35%, injury history 20%, movement asymmetry 20%, training load 15%, fatigue trend 10%.
- **Analytics** — risk distribution, movement-quality trends, factor contributions, athletes needing attention, platform statistics.
- **Report builder** — per-athlete or squad reports with date ranges, exported to PDF, Excel or CSV.
- **Alerts** — notifications raised when an analysis crosses a high or critical risk threshold.

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | TanStack Start (React 19, Vite 7) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Charts | Recharts |
| Data & auth | Supabase (Postgres, RLS, Auth) |
| Pose estimation | MediaPipe Tasks Vision (runs in the browser) |
| Exports | jsPDF, SheetJS |
| Tests | Vitest |

## Data model

| Table | Purpose |
| --- | --- |
| `profiles` | One row per user (name, avatar) |
| `user_roles` | Role assignments, checked through `has_role()` / `is_staff()` |
| `athlete_profiles` | Athlete demographics, sport, load, injury history |
| `video_submissions` | Submitted movement videos and review status |
| `pose_analyses` | Joint metrics, movement quality score, risk flags per video |
| `alerts` | High-risk notifications per athlete |

All tables use row-level security: athletes can only reach their own rows; staff
roles (coach, physiotherapist, sports scientist, administrator) get scoped
read/manage access through security-definer role helpers.

## Environment variables

Client (build time):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Server (runtime, never exposed to the browser):

```
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
```

## Local development

```bash
bun install
bun run dev        # http://localhost:8080
bun run test       # unit tests for the scoring engines
bun run build      # production build
```

## Docker

```bash
docker compose build
docker compose up -d      # http://localhost:3000
```

The image builds the app in a Bun stage and serves the compiled server output in
a slim runtime stage. Pass the Supabase variables through the compose file or a
`.env` file next to it.

## Cloud deployment

The production build outputs a standard server bundle in `.output/` and runs on
any Node/Bun-compatible host or edge platform. Set the environment variables
above, run the migrations in `supabase/migrations/` against the target database,
then start the server bundle.

## Documentation

- [`docs/user-guide.md`](docs/user-guide.md) — what each role can do
- [`docs/data-model.md`](docs/data-model.md) — tables, policies and scoring reference

## Disclaimer

Risk scores are a transparent, rule-based triage signal to guide where to look
next. They are not a trained injury-probability model and not a medical
diagnosis.
