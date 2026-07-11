from fastapi import APIRouter
from models.athlete import Athlete

router = APIRouter()


@router.get("/athlete", response_model=Athlete)
def get_athlete():
    return Athlete(
        name="Sejal Chintala",
        age=20,
        sport="Cricket",
        experience="Beginner"
    )