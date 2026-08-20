import sys
import os

# ── Path Setup ────────────────────────────────────────────────────────────────
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
m1_backend   = os.path.join(project_root, "Milestone_1", "backend")
backend_root = os.path.join(project_root, "backend")
m3_backend   = os.path.join(project_root, "Milestone_3", "backend")
m4_backend   = os.path.dirname(__file__)

for p in [project_root, m1_backend, backend_root, m3_backend, m4_backend]:
    if os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

# ── Namespace Path Merging for M3 and M4 ──────────────────────────────────────
try:
    import routers
    routers.__path__.append(os.path.join(m3_backend, "routers"))
    routers.__path__.append(os.path.join(m4_backend, "routers"))
except Exception:
    pass

try:
    import schemas
    schemas.__path__.append(os.path.join(m3_backend, "schemas"))
    schemas.__path__.append(os.path.join(m4_backend, "schemas"))
except Exception:
    pass

try:
    import services
    services.__path__.append(os.path.join(m3_backend, "services"))
    services.__path__.append(os.path.join(m4_backend, "services"))
except Exception:
    pass

try:
    import models
    models.__path__.append(os.path.join(m3_backend, "models"))
    models.__path__.append(os.path.join(m4_backend, "models"))
except Exception:
    pass

# ── Import Root App ───────────────────────────────────────────────────────────
from app.main import app as main_app
from fastapi.middleware.cors import CORSMiddleware

main_app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount Milestone 3 Routers ─────────────────────────────────────────────────
try:
    from routers.anomalies import router as anomalies_router
    from routers.injury_risk import router as injury_risk_router
    from routers.risk_scores import router as risk_scores_router
    from routers.recommendations import router as recommendations_router
    from routers.intelligence import router as intelligence_router
    from routers.pipeline import router as pipeline_router

    main_app.include_router(anomalies_router)
    main_app.include_router(injury_risk_router)
    main_app.include_router(risk_scores_router)
    main_app.include_router(recommendations_router)
    main_app.include_router(intelligence_router)
    main_app.include_router(pipeline_router)
    print("Milestone 3 routers mounted successfully.")
except Exception as e:
    print(f"Skipping Milestone 3 router mount: {e}")

# ── Mount Milestone 4 Routers ─────────────────────────────────────────────────
try:
    from routers.reports import router as reports_router
    from routers.history import router as history_router
    from routers.notifications import router as notifications_router

    main_app.include_router(reports_router)
    main_app.include_router(history_router)
    main_app.include_router(notifications_router)
    print("Milestone 4 routers mounted successfully.")
except Exception as e:
    print(f"Skipping Milestone 4 router mount: {e}")

app = main_app

print("Integrated backend (M1+M2+M3+M4) startup complete.")
