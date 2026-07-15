from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List

class AthleteCreate(BaseModel):
    athlete_id: Optional[str] = None  # Backend will generate if omitted
    full_name: str
    age: int
    gender: str
    sport: str
    playing_position: str
    height: str
    weight: str
    training_load: str
    experience: str
    fitness_level: str
    medical_notes: str
    injury_history: str
    emergency_contact: str
    coach_name: str
    photo: Optional[str] = None
    
    # Optional Fields
    disability_status: Optional[str] = None
    disability_type: Optional[str] = None
    assistive_device: Optional[str] = None

class AthleteUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    sport: Optional[str] = None
    playing_position: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    training_load: Optional[str] = None
    experience: Optional[str] = None
    fitness_level: Optional[str] = None
    medical_notes: Optional[str] = None
    injury_history: Optional[str] = None
    emergency_contact: Optional[str] = None
    coach_name: Optional[str] = None
    photo: Optional[str] = None
    
    # Optional Fields
    disability_status: Optional[str] = None
    disability_type: Optional[str] = None
    assistive_device: Optional[str] = None

class AthleteOut(BaseModel):
    id: str = Field(..., alias="_id")
    athlete_id: str
    full_name: str
    age: int
    gender: str
    sport: str
    playing_position: str
    height: str
    weight: str
    training_load: str
    experience: str
    fitness_level: str
    medical_notes: str
    injury_history: str
    emergency_contact: str
    coach_name: str
    photo: Optional[str] = None
    created_at: datetime
    created_by: str

    # Optional Fields
    disability_status: Optional[str] = None
    disability_type: Optional[str] = None
    assistive_device: Optional[str] = None

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}

class AthleteListResponse(BaseModel):
    athletes: List[AthleteOut]
    total: int
    page: int
    limit: int
    pages: int
