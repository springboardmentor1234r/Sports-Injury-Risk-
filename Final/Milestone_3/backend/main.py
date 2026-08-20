import sys
import os

# Resolve paths for uvicorn launch
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.main import app as main_app
from routers.anomalies import router as anomalies_router
from routers.injury_risk import router as injury_risk_router
from routers.risk_scores import router as risk_scores_router
from routers.recommendations import router as recommendations_router
from routers.intelligence import router as intelligence_router
from routers.pipeline import router as pipeline_router

# Include Milestone 3 routers
main_app.include_router(anomalies_router)
main_app.include_router(injury_risk_router)
main_app.include_router(risk_scores_router)
main_app.include_router(recommendations_router)
main_app.include_router(intelligence_router)
main_app.include_router(pipeline_router)

app = main_app
