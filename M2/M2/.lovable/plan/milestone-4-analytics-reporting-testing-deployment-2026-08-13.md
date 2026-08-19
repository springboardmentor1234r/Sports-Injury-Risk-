# Milestone 4 — Analytics, Reporting, Testing & Deployment

## Situation

The uploaded project archive contains work that is not in the current app: the pose estimation engine, biomechanical analysis, injury risk scoring, corrective recommendations and the analysis/reports screens. The live project only has the earlier authentication + athlete profile version, and the database only has `profiles`, `athlete_profiles` and `user_roles`.

So this runs in two stages: first bring the app back up to the uploaded state, then build Milestone 4 on top of it.

## Stage 1 — Restore the existing analysis platform

- Copy back the analysis engine libraries (pose estimation, biomechanics, injury risk scoring, recommendations) and their UI components (biomechanics report, injury risk card).
- Restore the upgraded screens: video upload, video analysis, analysis results, athlete detail, injuries, dashboard, reports, users.
- Add the pose estimation dependency used by the analysis engine.
- Apply the missing database tables with grants and row-level security:
  - `video_submissions` — athlete video links with review status
  - `pose_analyses` — joint metrics, movement quality score, risk flags per video
  - the staff read policy on profiles
- Verify the whole flow works end to end: submit video → run analysis → view biomechanics → view risk score and recommendations.

## Stage 2 — Milestone 4 features

### Executive dashboards
A new Analytics section, role-aware:
- Coach / Sports Scientist / Admin: squad-wide risk distribution (low / moderate / high / critical), average movement quality, athletes needing attention, risk trend over time.
- Physiotherapist: rehab caseload, open injuries, recovery progress.
- Athlete: personal risk trend, movement quality progression, recommendation completion.
- Admin: platform stats — users by role, videos processed, analyses run, alert volume.

### Visualization modules
Charts built with Recharts (already in the stack): trend lines for risk score over time, bar charts for per-joint biomechanical metrics, symmetry comparison, and a risk-category donut. Consistent with the existing design tokens.

### Reports & export
- A report builder page: pick athlete + date range + report type (injury risk, biomechanical assessment, movement analysis, athlete performance, rehabilitation).
- Rendered report view with charts, metrics tables and recommendations.
- **PDF export** (print-quality, branded header/footer) and **Excel/CSV export** of the underlying data.
- Reports list with re-download.

### Notification & alert system
- `alerts` table with row-level security; generated when an analysis crosses a high/critical risk threshold or training load is flagged.
- Bell menu in the header with unread count, plus an alerts page with read/dismiss.

### Validation & testing
- Input validation with Zod across all forms (video URL, athlete profile, report parameters).
- Vitest unit tests for the scoring engines: risk weighting model, biomechanics aggregation, anomaly thresholds, recommendation mapping.
- Empty, loading and error states on every data screen so no page can appear blank or broken.

### Deployment & documentation
- `Dockerfile` and `docker-compose.yml` for containerized deployment.
- `README.md` covering architecture, roles, environment variables, local run, Docker run, and cloud deployment notes.
- `docs/` with a user guide per role and an API/data-model reference.

## Technical notes

- Analytics and report data are read through the existing Supabase client with row-level security enforcing role scope; no new privileged paths.
- Risk score uses the weighted model already in the codebase (biomechanical deviations 35%, injury history 20%, asymmetry 20%, training load 15%, fatigue 10%).
- PDF export runs client-side from the rendered report; Excel export is generated from the same query result.
- All new routes live under the existing `_authenticated` layout with role gates; sidebar entries added per role.
- No milestone or internship wording anywhere in the UI.
