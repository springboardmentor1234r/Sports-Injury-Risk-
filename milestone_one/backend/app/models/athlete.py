import uuid
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional, List

class InjurySeverity(str, Enum):
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"

class InjuryHistoryEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    injury_type: str
    body_part: str
    date_occurred: datetime
    severity: InjurySeverity
    recovery_status: str
    notes: Optional[str] = None

class TrainingLoadEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: datetime
    load_score: int = Field(..., ge=0, le=10)
    session_type: str
    duration_minutes: int

class AthleteDoc(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    sport_type: Optional[str] = None
    position: Optional[str] = None
    age: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Embedded Sub-collections
    injury_history: List[InjuryHistoryEntry] = Field(default_factory=list)
    training_loads: List[TrainingLoadEntry] = Field(default_factory=list)

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user-uuid",
                "sport_type": "Basketball",
                "position": "Guard",
                "age": 24,
                "height": 195.0,
                "weight": 90.0,
                "injury_history": [],
                "training_loads": []
            }
        }
