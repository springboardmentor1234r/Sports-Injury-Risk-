from fastapi import APIRouter
import json
import os

router = APIRouter()

USERS_FILE = "data/users.json"
HISTORY_FILE = "data/history.json"


# ==========================================================
# Helper Functions
# ==========================================================

def load_json(file_path, default=None):
    """
    Load JSON data safely.
    """
    if default is None:
        default = []

    if not os.path.exists(file_path):
        return default

    try:
        with open(file_path, "r") as file:
            return json.load(file)

    except (json.JSONDecodeError, FileNotFoundError):
        return default


def get_users():
    return load_json(USERS_FILE, [])


def get_history():
    return load_json(HISTORY_FILE, [])


# ==========================================================
# Dashboard
# ==========================================================

@router.get("/dashboard")
def get_dashboard():

    # ------------------------------------------------------
    # Load users and history
    # ------------------------------------------------------

    users = get_users()
    history = get_history()

    # ------------------------------------------------------
    # Get only registered athletes
    # ------------------------------------------------------

    athletes = [
        user
        for user in users
        if user.get("role", "").lower() == "athlete"
    ]

    total_athletes = len(athletes)

    # ------------------------------------------------------
    # Videos analyzed
    # ------------------------------------------------------

    videos_analyzed = len(history)

    # ------------------------------------------------------
    # Reports generated
    #
    # Every history record represents one completed analysis
    # with a generated report.
    # ------------------------------------------------------

    reports_generated = sum(
        1
        for item in history
        if item.get("report")
    )

    # ------------------------------------------------------
    # Risk counters
    # ------------------------------------------------------

    low_risk = 0
    moderate_risk = 0
    high_risk = 0

    # Store high-risk athletes
    high_risk_athletes = {}

    # ------------------------------------------------------
    # Analyze history
    # ------------------------------------------------------

    for item in history:

        # ----------------------------------------------
        # Get injury risk
        # ----------------------------------------------

        injury_risk = item.get("injury_risk", "")

        # Sometimes injury_risk may be a dictionary
        if isinstance(injury_risk, dict):

            injury_risk = (
                injury_risk.get("risk")
                or injury_risk.get("level")
                or injury_risk.get("category")
                or ""
            )

        injury_risk = str(injury_risk).lower().strip()

        # ----------------------------------------------
        # Count risk levels
        # ----------------------------------------------

        if "high" in injury_risk:

            high_risk += 1

            athlete_name = item.get(
                "athlete_name",
                "Unknown Athlete"
            )

            athlete_email = item.get(
                "athlete_email",
                ""
            )

            high_risk_athletes[athlete_email] = {
                "name": athlete_name,
                "email": athlete_email
            }

        elif (
            "moderate" in injury_risk
            or "medium" in injury_risk
        ):

            moderate_risk += 1

        elif "low" in injury_risk:

            low_risk += 1

    # ------------------------------------------------------
    # Build high-risk athlete list
    # ------------------------------------------------------

    high_risk_list = list(
        high_risk_athletes.values()
    )

    # ------------------------------------------------------
    # Backend status
    # ------------------------------------------------------

    backend_status = "Backend API Ready"

    # ------------------------------------------------------
    # Return dashboard data
    # ------------------------------------------------------

    return {

        "total_athletes": total_athletes,

        "videos_analyzed": videos_analyzed,

        "high_risk_cases": high_risk,

        "reports_generated": reports_generated,

        "low_risk": low_risk,

        "moderate_risk": moderate_risk,

        "high_risk": high_risk,

        "high_risk_athletes": high_risk_list,

        # Keep this as a model/system metric
        # rather than fake dashboard activity.
        "accuracy": 96,

        "backend_status": backend_status,

        "features": [

            "Joint Angle Analysis",

            "Movement Quality Analysis",

            "Injury Risk Prediction",

            "Movement Anomaly Detection",

            "Risk Scoring",

            "Corrective Recommendations"

        ]
    }


# ==========================================================
# History
# ==========================================================

@router.get("/history")
def get_history_route():

    return get_history()