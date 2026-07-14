import uuid
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field

class UserRole(str, Enum):
    ATHLETE = "athlete"
    COACH = "coach"
    PHYSIOTHERAPIST = "physiotherapist"
    SPORTS_SCIENTIST = "sports_scientist"
    ADMIN = "admin"

class UserDoc(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    hashed_password: str
    role: UserRole = UserRole.ATHLETE
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "role": "athlete",
                "is_active": True
            }
        }
