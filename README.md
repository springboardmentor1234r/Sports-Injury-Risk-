# KinetIQ — AI Sports Injury Risk Detection from Video

KinetIQ is an AI-assisted sports injury-risk screening platform that analyzes athlete movement videos and converts them into biomechanical metrics, injury-risk scores, analytics, alerts, corrective recommendations, and reports.

> **Disclaimer:** KinetIQ is a screening and decision-support tool, not a medical diagnosis or replacement for professional assessment.

## Features

- **Role-based access** — Athlete, Coach, Physiotherapist, Sports Scientist, and Administrator.
- **Athlete registry** — Profiles, sport information, training load, injury history, and medical information.
- **Video submissions** — Athletes can submit movement videos for analysis and review.
- **Pose estimation** — Browser-based pose detection using MediaPipe Tasks Vision.
- **Biomechanical analysis** — Joint angles, range of motion, trunk lean, knee valgus, and left/right symmetry.
- **Injury-risk scoring** — Transparent weighted scoring based on biomechanical deviation, injury history, asymmetry, training load, and fatigue.
- **Corrective recommendations** — Movement-specific recommendations based on identified risk factors.
- **Analytics** — Risk distribution, movement trends, factor contributions, and athletes requiring attention.
- **Alerts** — Notifications for high and critical risk results.
- **Reports** — Athlete or squad reports with PDF, Excel, and CSV export.
- **Testing & deployment** — Vitest tests, Docker support, and production build configuration.

## Risk Scoring

| Risk Factor | Weight |
|---|---:|
| Biomechanical deviation | 35% |
| Injury history | 20% |
| Movement asymmetry | 20% |
| Training load | 15% |
| Fatigue trend | 10% |

The score is a transparent rule-based screening signal and is not a clinically validated injury probability.

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start, React 19, Vite 7 |
| Styling | Tailwind CSS v4, shadcn/ui |
| Database & Auth | Supabase PostgreSQL, Auth, RLS |
| Pose Estimation | MediaPipe Tasks Vision |
| Charts | Recharts |
| Exports | jsPDF, SheetJS |
| Testing | Vitest |
| Package Manager | Bun |
| Deployment | Docker / Docker Compose |

## Project Structure

The repository is organized by milestones:

M1/M1/   → Foundation
M2/M2/   → Biomechanics & Movement Analysis
M3/M3/   → Injury Risk & Recommendations
M4/M4/   → Analytics, Reporting, Testing & Deployment

Each milestone contains its own application source, Supabase configuration, documentation, and `.env.example`.

## Data Model

Main database tables:

| Table               | Purpose                         |
| ------------------- | ------------------------------- |
| `profiles`          | User profiles                   |
| `user_roles`        | Role assignments                |
| `athlete_profiles`  | Athlete information and history |
| `video_submissions` | Submitted movement videos       |
| `pose_analyses`     | Biomechanical analysis results  |
| `alerts`            | High-risk notifications         |

All relevant data is protected using Supabase Row Level Security (RLS).

## Environment Setup

`.env` files are intentionally **not committed** to the repository.

Each milestone provides an `.env.example`:

```env
SUPABASE_PROJECT_ID="your-project-id"
SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
SUPABASE_URL="https://your-project.supabase.co"

VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
VITE_SUPABASE_URL="https://your-project.supabase.co"

Create the local environment file:

```bash
cp .env.example .env
```

Then add the appropriate Supabase project values.

**Never commit passwords, service-role keys, private API keys, or other secrets.**

## Local Development

Choose a milestone and enter its project directory:

```bash
cd M4/M4
```

Install dependencies:

```bash
bun install
```

Start development:

```bash
bun run dev
```

The development server runs at:

```text
http://localhost:8080
```

### Testing

```bash
bun run test
```

### Production Build

```bash
bun run build
```

## Docker

Build and run the application with:

```bash
docker compose build
docker compose up -d
```

The Docker application runs at:

```text
http://localhost:3000
```

## Supabase

Database migrations are located in:

```text
supabase/migrations/
```

For a fresh setup:

1. Configure the Supabase project.
2. Create the required `.env`.
3. Apply the migrations.
4. Verify Auth and RLS configuration.
5. Run the application.

## Documentation

Additional documentation is available inside the milestone projects:

* `docs/user-guide.md` — user roles and platform functionality
* `docs/data-model.md` — database structure, policies, and scoring reference

## Git Workflow

1. Clone the repository.
2. Create your assigned branch.
3. Work inside the appropriate milestone.
4. Do not commit `.env`, `node_modules`, cache files, or secrets.
5. Use meaningful commit messages.
6. Push your branch to GitHub.

Example:

```bash
git checkout -b feature/my-feature
git add .
git commit -m "Add movement analysis feature"
git push origin feature/my-feature
```

## Testing the Project

For a fresh checkout:

```bash
cd M4/M4
bun install
cp .env.example .env
bun run dev
```

The tester must provide the appropriate Supabase configuration in the local `.env` file because real credentials are intentionally excluded from GitHub.

## Milestones

* **M1** — Application foundation, authentication, roles, athletes, and core infrastructure.
* **M2** — Pose estimation, video analysis, and biomechanical metrics.
* **M3** — Injury-risk scoring and corrective recommendations.
* **M4** — Analytics, alerts, reporting, exports, testing, and deployment.

---

**KinetIQ — AI-assisted sports injury-risk detection and movement analysis from video.**

```
```
