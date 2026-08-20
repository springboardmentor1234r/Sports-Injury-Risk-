from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
import json


router = APIRouter()


# ==========================================================
# PATH CONFIGURATION
# ==========================================================

# backend/
# ├── routes/
# │   └── athlete_routes.py
# ├── data/
# │   └── athletes.json
# └── main.py

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = BASE_DIR / "data"
ATHLETES_FILE = DATA_DIR / "athletes.json"


# ==========================================================
# ATHLETE MODEL
# ==========================================================

class Athlete(BaseModel):
    name: str
    age: int
    sport: str
    experience: str


# ==========================================================
# CREATE DATA FILE IF IT DOES NOT EXIST
# ==========================================================

def ensure_data_file():
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if not ATHLETES_FILE.exists():
        with open(ATHLETES_FILE, "w") as file:
            json.dump([], file, indent=4)


# ==========================================================
# LOAD ATHLETES
# ==========================================================

def load_athletes():
    ensure_data_file()

    try:
        with open(ATHLETES_FILE, "r") as file:
            data = json.load(file)

            if isinstance(data, list):
                return data

            return []

    except (json.JSONDecodeError, FileNotFoundError):
        return []


# ==========================================================
# SAVE ATHLETES
# ==========================================================

def save_athletes(athletes):
    ensure_data_file()

    with open(ATHLETES_FILE, "w") as file:
        json.dump(
            athletes,
            file,
            indent=4
        )


# ==========================================================
# GET ALL ATHLETES
# ==========================================================

@router.get("/athletes")
def get_all_athletes():

    athletes = load_athletes()

    return athletes


# ==========================================================
# GET SINGLE ATHLETE
# ==========================================================

@router.get("/athlete")
def get_athlete():

    athletes = load_athletes()

    if not athletes:
        return {
            "message": "No athletes registered"
        }

    return athletes[0]


# ==========================================================
# CREATE ATHLETE
# ==========================================================

@router.post("/athlete")
def create_athlete(athlete: Athlete):

    athletes = load_athletes()

    # ------------------------------------------------------
    # Create athlete dictionary
    # ------------------------------------------------------

    new_athlete = {
        "id": len(athletes) + 1,
        "name": athlete.name.strip(),
        "age": athlete.age,
        "sport": athlete.sport.strip(),
        "experience": athlete.experience.strip()
    }

    # ------------------------------------------------------
    # Add athlete
    # ------------------------------------------------------

    athletes.append(new_athlete)

    # ------------------------------------------------------
    # SAVE TO JSON FILE
    # ------------------------------------------------------

    save_athletes(athletes)

    print(
        "REGISTERING ATHLETE:",
        new_athlete
    )

    # ------------------------------------------------------
    # RESPONSE
    # ------------------------------------------------------

    return {
        "message": "Athlete profile created successfully",
        "athlete": new_athlete,
        "total_athletes": len(athletes)
    }


# ==========================================================
# DELETE ATHLETE
# ==========================================================

@router.delete("/athlete/{athlete_id}")
def delete_athlete(athlete_id: int):

    athletes = load_athletes()

    updated_athletes = [
        athlete
        for athlete in athletes
        if athlete.get("id") != athlete_id
    ]

    if len(updated_athletes) == len(athletes):

        raise HTTPException(
            status_code=404,
            detail="Athlete not found"
        )

    # Re-number IDs
    for index, athlete in enumerate(
        updated_athletes,
        start=1
    ):
        athlete["id"] = index

    save_athletes(updated_athletes)

    return {
        "message": "Athlete deleted successfully",
        "total_athletes": len(updated_athletes)
    }