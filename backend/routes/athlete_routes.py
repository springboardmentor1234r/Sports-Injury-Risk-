from fastapi import APIRouter
from models.athlete import Athlete

router = APIRouter()
athletes = [] 

@router.get("/athlete", response_model=Athlete)
def get_athlete():
    return Athlete(
        name="Sejal Chintala",
        age=20,
        sport="Cricket",
        experience="Beginner"
    )

@router.post("/athlete")
def create_athlete(athlete: Athlete):
    athletes.append(athlete)

    return {
        "message": "Athlete profile created successfully",
        "total_athletes": len(athletes)
    }


@router.get("/athletes")
def get_all_athletes():
    return athletes

