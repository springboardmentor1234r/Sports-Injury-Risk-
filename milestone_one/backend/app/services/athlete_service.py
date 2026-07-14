from typing import Optional, List
from app.database import get_db
from app.models.athlete import AthleteDoc, InjuryHistoryEntry, TrainingLoadEntry
from app.schemas.athlete import AthleteCreate, AthleteUpdate

class AthleteService:
    @staticmethod
    async def create_profile(data: AthleteCreate) -> AthleteDoc:
        db = get_db()
        profile = AthleteDoc(
            user_id=data.user_id,
            sport_type=data.sport_type,
            position=data.position,
            age=data.age,
            height=data.height,
            weight=data.weight
        )
        await db.athletes.insert_one(profile.model_dump())
        return profile

    @staticmethod
    async def get_by_id(athlete_id: str) -> Optional[AthleteDoc]:
        db = get_db()
        data = await db.athletes.find_one({"id": athlete_id})
        return AthleteDoc(**data) if data else None

    @staticmethod
    async def get_by_user_id(user_id: str) -> Optional[AthleteDoc]:
        db = get_db()
        data = await db.athletes.find_one({"user_id": user_id})
        return AthleteDoc(**data) if data else None

    @staticmethod
    async def update_profile(athlete_id: str, data: AthleteUpdate) -> Optional[AthleteDoc]:
        db = get_db()
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}
        if not update_data:
            return await AthleteService.get_by_id(athlete_id)
            
        await db.athletes.update_one({"id": athlete_id}, {"$set": update_data})
        return await AthleteService.get_by_id(athlete_id)

    @staticmethod
    async def get_injuries(athlete_id: str) -> List[InjuryHistoryEntry]:
        profile = await AthleteService.get_by_id(athlete_id)
        return profile.injury_history if profile else []

    @staticmethod
    async def add_injury(athlete_id: str, entry: InjuryHistoryEntry) -> bool:
        db = get_db()
        result = await db.athletes.update_one(
            {"id": athlete_id},
            {"$push": {"injury_history": entry.model_dump()}}
        )
        return result.modified_count > 0

    @staticmethod
    async def add_training_load(athlete_id: str, entry: TrainingLoadEntry) -> bool:
        db = get_db()
        result = await db.athletes.update_one(
            {"id": athlete_id},
            {"$push": {"training_loads": entry.model_dump()}}
        )
        return result.modified_count > 0

    @staticmethod
    async def list_all_profiles() -> List[AthleteDoc]:
        db = get_db()
        cursor = db.athletes.find({})
        profiles = []
        async for doc in cursor:
            profiles.append(AthleteDoc(**doc))
        return profiles

