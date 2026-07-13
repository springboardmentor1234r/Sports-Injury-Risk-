# User model placeholder
from typing import Optional
from beanie import Document, Indexed
from pydantic import EmailStr
import enum

class UserRole(str, enum.Enum):
    ATHLETE = "athlete"
    COACH = "coach"
    PHYSIO = "physiotherapist"
    SCIENTIST = "sports_scientist"
    ADMIN = "administrator"

class User(Document):
    email: Indexed(EmailStr, unique=True)
    hashed_password: str
    full_name: str
    role: UserRole = UserRole.ATHLETE
    is_active: bool = True

    class Settings:
        name = "users"

class AthleteProfile(Document):
    user_id: str # Reference to User ID
    sport_type: str
    position: Optional[str] = None
    age: int
    height: float
    weight: float
    injury_history: Optional[str] = None
    training_load: int = 5 # 1-10

    class Settings:
        name = "athlete_profiles"