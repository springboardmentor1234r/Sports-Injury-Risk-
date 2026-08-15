from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from app import models, schemas, auth
import datetime

# --- User CRUD ---
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, user: schemas.UserCreate):
    import uuid
    hashed_pw = auth.get_password_hash(user.password)
    verification_token = str(uuid.uuid4())
    db_user = models.User(
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        hashed_password=hashed_pw,
        is_verified=True,
        verification_token=verification_token
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # If registering as an athlete, initialize an athlete record
    if db_user.role == "athlete":
        db_athlete = models.Athlete(user_id=db_user.id)
        db.add(db_athlete)
        db.commit()
        db.refresh(db_athlete)
        
    return db_user


# --- Athlete CRUD ---
def get_athlete_by_user_id(db: Session, user_id: int) -> models.Athlete:
    return db.query(models.Athlete).filter(models.Athlete.user_id == user_id).first()

def get_athlete_full_profile(db: Session, athlete_id: int) -> models.Athlete:
    return db.query(models.Athlete)\
             .options(
                 joinedload(models.Athlete.user),
                 joinedload(models.Athlete.injury_history),
                 joinedload(models.Athlete.training_load),
                 joinedload(models.Athlete.videos)
             )\
             .filter(models.Athlete.id == athlete_id).first()

def update_athlete_profile(db: Session, athlete_id: int, profile_update: schemas.AthleteUpdate) -> models.Athlete:
    db_athlete = db.query(models.Athlete).filter(models.Athlete.id == athlete_id).first()
    if not db_athlete:
        return None
        
    update_data = profile_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_athlete, key, value)
        
    db.commit()
    db.refresh(db_athlete)
    return db_athlete


# --- Injury CRUD ---
def get_athlete_injuries(db: Session, athlete_id: int):
    return db.query(models.InjuryHistory).filter(models.InjuryHistory.athlete_id == athlete_id).all()

def create_injury_log(db: Session, athlete_id: int, injury: schemas.InjuryHistoryCreate):
    db_injury = models.InjuryHistory(
        athlete_id=athlete_id,
        injury_type=injury.injury_type,
        body_part=injury.body_part,
        severity=injury.severity,
        occurrence_date=injury.occurrence_date,
        status=injury.status,
        notes=injury.notes
    )
    db.add(db_injury)
    db.commit()
    db.refresh(db_injury)
    return db_injury


# --- Training Load CRUD ---
def get_athlete_training_load(db: Session, athlete_id: int):
    return db.query(models.TrainingLoad).filter(models.TrainingLoad.athlete_id == athlete_id).order_by(models.TrainingLoad.date.desc()).all()

def create_training_log(db: Session, athlete_id: int, training: schemas.TrainingLoadCreate):
    calculated_val = training.duration_minutes * training.rpe
    db_training = models.TrainingLoad(
        athlete_id=athlete_id,
        date=training.date,
        activity_type=training.activity_type,
        duration_minutes=training.duration_minutes,
        rpe=training.rpe,
        calculated_load=calculated_val,
        notes=training.notes
    )
    db.add(db_training)
    db.commit()
    db.refresh(db_training)
    return db_training


# --- Video CRUD ---
def get_athlete_videos(db: Session, athlete_id: int):
    return db.query(models.Video).filter(models.Video.athlete_id == athlete_id).order_by(models.Video.uploaded_at.desc()).all()

def create_video_record(db: Session, athlete_id: int, video: schemas.VideoCreate):
    db_video = models.Video(
        athlete_id=athlete_id,
        title=video.title,
        description=video.description,
        file_path=video.file_path,
        status="uploaded",
        dataset_source=video.dataset_source
    )
    db.add(db_video)
    db.commit()
    db.refresh(db_video)
    return db_video

def delete_video_record(db: Session, video_id: int):
    video = db.query(models.Video).filter(models.Video.id == video_id).first()
    if not video:
        return None
    db.delete(video)
    db.commit()
    return video
