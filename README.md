# KinetIQ — AI Sports Injury Risk Detection Platform

KinetIQ turns athlete training/match video into biomechanical intelligence:
pose estimation, movement quality scoring, and role-based dashboards for
injury-risk assessment. This repo is the web app — a TanStack Start
(React 19) front end backed by Supabase for auth, database, and row-level
security.

> Video upload currently accepts a **link** (YouTube, Vimeo, Drive, direct
> `.mp4` URL, etc.) rather than a file upload — see [Current status](#current-status-what-works-today).

## Tech stack

| Layer | Choice |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) (React 19, file-based routing, SSR) |
| Routing | [TanStack Router](https://tanstack.com/router) — see `src/routes/README.md` for file-routing conventions |
| Data fetching | [TanStack Query](https://tanstack.com/query) |
| Backend | [Supabase](https://supabase.com) (Postgres, Auth, Row-Level Security) |
| Styling | Tailwind CSS v4 |
| UI components | [shadcn/ui](https://ui.shadcn.com) (`new-york` style) on Radix primitives |
| Forms | react-hook-form + zod |
| Pose estimation | [MediaPipe Tasks Vision](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker) (BlazePose, runs client-side via WASM) |
| Charts | [Recharts](https://recharts.org) (via the project's shadcn `ChartContainer` wrapper) |
| Deploy target | Cloudflare Workers, via Nitro's `cloudflare-module` preset (see `vite.config.ts`) |
| Package manager | [Bun](https://bun.sh) (see `bunfig.toml`) — npm/pnpm also work, the scripts are package-manager agnostic |

## Getting started

### Prerequisites

- [Bun](https://bun.sh) 1.x (recommended) — or Node.js 18+ with npm
- A [Supabase](https://supabase.com) project (free tier is fine)

### 1. Install dependencies

```bash
bun install
# or: npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in the values from your Supabase project's **Settings → API**:

| Variable | Where to find it |
|---|---|
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `anon` / publishable API key |
| `VITE_SUPABASE_PROJECT_ID` | Project reference ID |
| `SUPABASE_URL` | Same as above — used server-side (SSR) |
| `SUPABASE_PUBLISHABLE_KEY` | Same as above — used server-side (SSR) |
| `SUPABASE_PROJECT_ID` | Same as above — used server-side (SSR) |

The `VITE_`-prefixed variables are exposed to the browser bundle; the
unprefixed ones are read server-side only (see `src/integrations/supabase/client.server.ts`
and `client.ts`).

### 3. Set up the database

Apply the migrations in `supabase/migrations/` to your Supabase project, in
order, either via the Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

or by pasting each file into the Supabase SQL Editor in filename order.

This creates:
- the `app_role` enum and `profiles` / `user_roles` tables (with a
  `handle_new_user` trigger that provisions both on signup)
- `athlete_profiles` — sport, position, age, height, weight, training load
- `video_submissions` — athlete-submitted video links for staff review
- `pose_analyses` — computed biomechanical metrics and movement quality scores per video (Milestone 2)
- `has_role()` / `is_staff()` helper functions used throughout the Row-Level
  Security policies

### 4. Run the dev server

```bash
bun run dev
# or: npm run dev
```

The app will be available at the URL Vite prints (default `http://localhost:3000`).

## Available scripts

| Command | Purpose |
|---|---|
| `dev` | Start the Vite dev server |
| `build` | Production build |
| `build:dev` | Build in development mode (unminified, for debugging a build) |
| `preview` | Preview a production build locally |
| `lint` | Run ESLint |
| `format` | Format the codebase with Prettier |

## Roles & access control

Five roles, assigned at signup and stored in `user_roles`:

| Role | Can access |
|---|---|
| **Athlete** | Own profile (`/my-profile`), own injury history (`/my-injuries`), personal analysis results (`/analysis`), video upload (`/upload`) |
| **Coach** | Athlete roster (`/athletes`, create/edit), reports (`/reports`) |
| **Physiotherapist** | Injury management (`/injuries`), reports (`/reports`) |
| **Sports Scientist** | Video analysis (`/video-analysis`), reports (`/reports`) |
| **Administrator** | Everything above, plus user management (`/users`) and system settings (`/system`) |

Access is enforced in two places:
- **Client-side**: the `<RoleGate allow={[...]}>` component (`src/lib/role-guard.tsx`) gates each route's UI and shows an "Access denied" screen otherwise.
- **Database-side**: Postgres Row-Level Security policies (see `supabase/migrations/`) using the `has_role()` / `is_staff()` functions — this is the layer that actually matters for security, since client-side gating alone can be bypassed.

## Project structure

```
src/
├── routes/                    # file-based routes (see routes/README.md)
│   ├── index.tsx               # marketing/landing page
│   ├── auth.tsx                 # sign in / sign up
│   └── _authenticated/          # everything behind login
│       ├── dashboard.tsx
│       ├── athletes.tsx / athletes.$id.tsx / athletes.new.tsx
│       ├── my-profile.tsx / my-injuries.tsx / analysis.tsx   (athlete)
│       ├── injuries.tsx                                       (physio)
│       ├── video-analysis.tsx                                 (sports scientist)
│       ├── upload.tsx                                          (athlete)
│       ├── reports.tsx                                (coach/physio/scientist/admin)
│       ├── users.tsx / system.tsx                              (admin)
│       └── settings.tsx
├── components/
│   ├── ui/                    # shadcn/ui primitives
│   ├── athlete-form.tsx       # shared create/edit athlete form
│   ├── biomechanics-report.tsx # score + metrics + chart, used by video-analysis & analysis pages
│   ├── injury-risk-card.tsx   # weighted score + category breakdown + recommendations (Milestone 3)
│   └── empty-page.tsx         # placeholder for not-yet-built feature pages
├── lib/
│   ├── auth-context.tsx       # session + role state (React context)
│   ├── role-guard.tsx         # <RoleGate> access control component
│   ├── pose-estimation.ts     # client-side MediaPipe pose sampling (Milestone 2)
│   ├── biomechanics.ts        # pure joint-angle / quality-score calculations (Milestone 2)
│   ├── injury-risk.ts         # weighted injury-risk scoring & recommendations (Milestone 3)
│   └── error-*.ts             # SSR error capture/reporting
├── integrations/supabase/     # Supabase client (browser + server) and auth wiring
├── router.tsx / start.ts / server.ts   # TanStack Start app wiring
└── styles.css

supabase/
├── config.toml
└── migrations/                 # applied in filename order
```

## Current status: what works today

- ✅ Auth (sign up/in, role selection at signup), role-based routing and access control
- ✅ Athlete profile management (create, view, edit, delete) with injury history
- ✅ Video submission via link (not file upload) with staff review status
- ✅ **Pose estimation & biomechanical analysis (Milestone 2)** — sports scientists can run pose
  estimation on submitted videos and get a movement quality score, biomechanical metrics
  (knee ROM, trunk lean, a 2D knee-alignment/valgus proxy, left/right symmetry), and rule-based
  risk flags. Athletes see their own results on `/analysis`. See
  [Milestone 2 details](#milestone-2-pose-estimation--biomechanical-analysis) below —
  there's one real architectural constraint worth reading before you rely on it.
- ✅ **Injury risk prediction, scoring & recommendations (Milestone 3)** — a weighted injury-risk
  score (0–100) per athlete, combining biomechanical deviations, movement asymmetry, training
  load, injury/medical history, and a fatigue trend across an athlete's analysis history, plus
  a per-category breakdown (ACL, hamstring, ankle sprain, shoulder, lower back, overuse) and
  rule-based corrective recommendations. Surfaced on `/reports` (team-wide, coach/physio/sports
  scientist/admin), `/analysis` (athlete's own profile), and each athlete's detail page. See
  [Milestone 3 details](#milestone-3-injury-risk-prediction--scoring) below.
- ⬜ Admin system metrics (`/system`) are **not implemented yet** — that page still renders a
  placeholder ("coming soon") screen (`EmptyPage` component). Everything else in the original
  Milestone 1–3 scope is built.

## Milestone 2: Pose estimation & biomechanical analysis

**How it works:** pose estimation runs entirely client-side, in the browser, using
[MediaPipe Tasks Vision](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker)
(BlazePose, WASM). There's no video-processing backend service — this app deploys to Cloudflare
Workers, which can't run a GPU-backed CV pipeline, so a sports scientist's own browser does the
inference when they click "Run analysis" on `/video-analysis`.

- `src/lib/pose-estimation.ts` — samples a video element every 200ms (capped at the first 30s of
  a clip) and returns pose landmarks per sampled frame.
- `src/lib/biomechanics.ts` — pure functions that turn those landmarks into joint angles
  (knee/hip/elbow flexion, trunk lean, a frontal-plane knee-alignment proxy for valgus/varus),
  aggregate them (range of motion, left/right symmetry), and compute a 0–100 movement quality
  score plus rule-based risk flags. No browser APIs — it's covered by a quick synthetic-data
  sanity check, not a full test suite.
- `src/components/biomechanics-report.tsx` — shared report UI (score, metric grid, risk flags,
  joint-angle chart) used on both `/video-analysis` (staff) and `/analysis` (athlete).
- Results are stored in the `pose_analyses` table (see the Milestone 2 migration), one row per
  video submission, upserted on re-run.

**Important limitation — direct video files only:** the browser can only read pixel data out of
a video *it controls directly* — a `.mp4`/`.webm`/`.mov` file it can decode. It cannot read pixels
out of an embedded, cross-origin player, which is exactly what a YouTube, Vimeo, or Google Drive
preview link is (browsers deliberately block that — it's not a bug to work around). Since the
existing video-submission flow accepts *any* link, `/video-analysis` checks each submission's URL
and only offers "Run analysis" for ones that resolve to a direct video file; everything else is
labeled "Needs direct file link." If this needs to support arbitrary YouTube/Vimeo links going
forward, the two realistic paths are: (a) have athletes upload actual files to Supabase Storage
instead of pasting links, or (b) add a real backend video-processing service (e.g. a queue +
worker that downloads the video and runs pose estimation off-device) — a meaningfully bigger
change than this milestone's scope.

**On the movement quality score and risk flags:** both are transparent, rule-based calculations
(documented with their thresholds in `biomechanics.ts`), not a trained model. Building a genuine
injury-*probability* model — the kind that learns from historical injury outcomes — is Milestone
3 scope in the original spec, and needs a labeled dataset this app doesn't have yet.

## Milestone 3: Injury risk prediction & scoring

**How it works:** `src/lib/injury-risk.ts` combines four kinds of input into one 0–100 injury
risk score per athlete, using the weighted model from the project spec:

| Component | Weight | Source |
|---|---|---|
| Biomechanical deviations | 35% | Latest `pose_analyses` — knee valgus / trunk lean vs. the thresholds in `biomechanics.ts` |
| Historical injury factors | 20% | `athlete_profiles.injury_history` / `current_medical_conditions` — presence-based, see caveat below |
| Movement asymmetry | 20% | Latest `pose_analyses` — left/right knee & hip ROM difference |
| Training load indicators | 15% | `athlete_profiles.training_load` (low/moderate/high/very_high) |
| Fatigue indicators | 10% | Trend across an athlete's analysis *history* — declining movement-quality scores across successive videos, blended with training load |

That score maps to one of four risk levels (Low / Moderate / High / Critical), and the same
inputs feed a per-category breakdown for **ACL, hamstring, ankle sprain, shoulder, lower back,
and overuse** injury risk, plus a short list of rule-based corrective recommendations (mechanics
coaching, unilateral strength work, deload suggestions, physio review flags, etc.) — all
generated in `injury-risk.ts` and rendered by the shared `<InjuryRiskCard>` component.

- `/reports` (coach, physiotherapist, sports scientist, administrator) — team-wide table, sortable
  by risk level, with per-athlete drill-down.
- `/analysis` (athlete) — the athlete's own risk profile, above their existing per-video reports.
- `/athletes/$id` (staff) — the same profile for a single athlete, above the edit form.

**Same caveat as Milestone 2, extended:** this is a documented, threshold-based heuristic, not a
trained ML classifier — there's no labeled dataset of real injury outcomes to learn from yet (the
FIFA Injury Dataset referenced in the project spec would be a starting point). Two specific
simplifications worth knowing about:
- **Historical injury factors is presence-based, not severity-based.** `injury_history` and
  `current_medical_conditions` are free text, not structured records (injury type / date / side /
  severity), so the score can only detect "something is recorded" rather than "how bad it was."
  Adding structured injury records would sharpen this considerably.
- **Shoulder and overuse risk lean mainly on training load, history, and fatigue trend**, not
  measured biomechanics — Milestone 2's pose-estimation engine samples lower-body and trunk
  landmarks (it targets running/jumping/landing/squatting), and doesn't compute elbow/shoulder
  joint-angle aggregates yet. ACL, hamstring, ankle-sprain, and lower-back estimates do draw on
  real measured metrics (knee alignment, trunk lean, left/right asymmetry).

Treat the output as a triage signal for where to look next — which athletes and which movement
patterns deserve a closer look — not as a diagnosis.

## Deployment

The Vite/Nitro config targets **Cloudflare Workers** (`nitro({ preset: "cloudflare-module" })`
in `vite.config.ts`), and `src/server.ts` implements the Workers
`fetch(request, env, ctx)` signature. To deploy elsewhere, swap the Nitro
preset — see the [Nitro deployment docs](https://nitro.build/deploy) for the
full list of supported targets.
