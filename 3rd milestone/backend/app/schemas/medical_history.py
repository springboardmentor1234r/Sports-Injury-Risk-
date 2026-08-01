from pydantic import BaseModel
from datetime import date
from typing import Optional

class MedicalHistoryBase(BaseModel):
    athlete_id: int
    injury_type: str
    date_of_injury: date
    recovery_status: Optional[str] = None
    notes: Optional[str] = None

class MedicalHistoryCreate(MedicalHistoryBase):
    pass

class MedicalHistoryUpdate(BaseModel):
    recovery_status: Optional[str] = None
    notes: Optional[str] = None

class MedicalHistoryInDBBase(MedicalHistoryBase):
    id: int

    class Config:
        from_attributes = True

class MedicalHistoryResponse(MedicalHistoryInDBBase):
    pass
