# Data model & scoring reference

## Tables

| Table | Key columns | Access |
| --- | --- | --- |
| `profiles` | `id`, `full_name`, `avatar_url` | Own row; staff can read all |
| `user_roles` | `user_id`, `role` | Own roles; administrators manage all |
| `athlete_profiles` | demographics, `sport_type`, `training_load`, `injury_history`, `current_medical_conditions` | Own row or staff |
| `video_submissions` | `athlete_user_id`, `title`, `video_url`, `status` | Own rows; staff read/manage |
| `pose_analyses` | `video_submission_id`, `movement_quality_score`, `risk_flags`, `joint_metrics` | Athlete reads own; staff create/edit |
| `alerts` | `athlete_user_id`, `severity`, `category`, `title`, `message`, `is_read` | Own alerts; staff read/create all |

Role checks use the security-definer helpers `has_role(user, role)` and
`is_staff(user)` so policies never recurse through `user_roles`.

## Risk scoring

```
overall = 0.35 * biomechanical deviation
        + 0.20 * injury history factors
        + 0.20 * movement asymmetry
        + 0.15 * training load indicators
        + 0.10 * fatigue trend
```

Bands: 0–24 low · 25–49 moderate · 50–74 high · 75–100 critical.

Category risks (ACL, hamstring, ankle, shoulder, lower back, overuse) are
derived from the same components with joint-specific weighting. Thresholds:
knee valgus 12°/20°, trunk lean 15°/25°, left-right ROM difference 15%/25%.

## Analysis pipeline

1. Athlete submits a video link (`video_submissions`).
2. A sports scientist runs pose estimation in the browser (MediaPipe).
3. Frames are converted to joint angles and aggregates (`src/lib/biomechanics.ts`).
4. The result is stored in `pose_analyses`.
5. Risk is computed on read (`src/lib/injury-risk.ts`) and surfaced in analytics,
   reports and alerts.
