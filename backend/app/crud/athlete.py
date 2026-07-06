from sqlalchemy.orm import Session

from app.models.athlete import Athlete
from app.schemas.athlete import AthleteCreate


def create_athlete(db: Session, athlete: AthleteCreate):
    new_athlete = Athlete(
        full_name=athlete.full_name,
        age=athlete.age,
        gender=athlete.gender,
        sport=athlete.sport,
        position=athlete.position,
        height=athlete.height,
        weight=athlete.weight,
        injury_history=athlete.injury_history,
        training_load=athlete.training_load,
        performance_score=athlete.performance_score,
        physical_assessment=athlete.physical_assessment,
    )

    db.add(new_athlete)
    db.commit()
    db.refresh(new_athlete)

    return new_athlete


def get_all_athletes(db: Session):
    return db.query(Athlete).all()


def get_athlete_by_id(db: Session, athlete_id: int):
    return db.query(Athlete).filter(Athlete.id == athlete_id).first()


def update_athlete(db: Session, athlete_id: int, athlete: AthleteCreate):
    existing_athlete = db.query(Athlete).filter(Athlete.id == athlete_id).first()

    if existing_athlete:
        existing_athlete.full_name = athlete.full_name
        existing_athlete.age = athlete.age
        existing_athlete.gender = athlete.gender
        existing_athlete.sport = athlete.sport
        existing_athlete.position = athlete.position
        existing_athlete.height = athlete.height
        existing_athlete.weight = athlete.weight
        existing_athlete.injury_history = athlete.injury_history
        existing_athlete.training_load = athlete.training_load
        existing_athlete.performance_score = athlete.performance_score
        existing_athlete.physical_assessment = athlete.physical_assessment

        db.commit()
        db.refresh(existing_athlete)

    return existing_athlete


def delete_athlete(db: Session, athlete_id: int):
    athlete = db.query(Athlete).filter(Athlete.id == athlete_id).first()

    if athlete:
        db.delete(athlete)
        db.commit()

    return athlete