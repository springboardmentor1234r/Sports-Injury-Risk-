# Architecture and API Notes

## Runtime flow

```text
React dashboard -> FastAPI routers -> SQLAlchemy/PostgreSQL or SQLite
                                 -> background video task -> pose estimator
                                                           -> biomechanics
                                                           -> intelligence snapshot
```

The existing `BackgroundTasks` video workflow saves the upload first and processes it after the API response. On a successful pose/biomechanics result, it writes an `IntelligenceAssessment`, zero or more `MovementAnomaly` records, and data-linked `Recommendation` records. A processing failure sets the existing video record status to `failed` and logs the error without exposing sensitive values.

## Persistence additions

- `intelligence_assessments`: versioned analytical snapshot, metrics, explanation, transparent weights, and category estimates.
- `movement_anomalies`: historical anomaly type, severity, body region, available frame, explanation, and action.
- `recommendations`: historical data-linked corrective/load/recovery recommendation and rationale.

These are additive SQLAlchemy tables. `Base.metadata.create_all()` creates them on startup; no existing records, uploads, tables, or fields are removed.

## Assessment method

The rule-based estimate uses inputs that are actually available in this project: derived pose metrics, ACWR/training RPE, and injury history. It applies the required weights: 35% biomechanical deviations, 20% historical injury factors, 20% movement asymmetry, 15% training-load indicators, and 10% fatigue indicators. Six category estimates (ACL, hamstring, ankle sprain, shoulder, lower-back, and overuse) are returned with their contributing inputs. This is an explainable analytical aid, not a medical diagnosis or validated clinical predictor.

## Authorization

- Athletes may read/create only their own assessment.
- Coach, physiotherapist, sports scientist, and administrator roles may use the executive summary.
- Existing athlete/profile/video access checks remain in place.

## API additions

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/intelligence/athletes/{athlete_id}` | Latest snapshot; creates one from available data when none exists. |
| POST | `/api/intelligence/athletes/{athlete_id}/assess` | Persist a fresh assessment snapshot. |
| GET | `/api/intelligence/executive` | Risk distribution, high-risk list, recent anomalies/assessments, and team averages. |

The existing report endpoints remain `GET /api/reports/csv/{athlete_id}` and `GET /api/reports/pdf/{athlete_id}`. The latter returns print-ready HTML, not a binary PDF; this naming limitation is retained for compatibility and should not be represented as a generated PDF.

## Verification scope

`python verify_hub.py` verifies the authenticated workflow against an isolated SQLite database. It currently uses the pose service’s synthetic fallback if OpenCV/MediaPipe are unavailable. Docker and AWS are not validated by that test.
