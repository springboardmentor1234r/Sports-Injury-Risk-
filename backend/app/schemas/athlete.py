from pydantic import BaseModel


class AthleteCreate(BaseModel):
    full_name: str
    age: int
    gender: str
    sport: str
    position: str
    height: float
    weight: float
    injury_history: str
    training_load: str
    performance_score: float
    physical_assessment: str


class AthleteResponse(BaseModel):
    id: int
    full_name: str
    age: int
    gender: str
    sport: str
    position: str
    height: float
    weight: float
    injury_history: str
    training_load: str
    performance_score: float
    physical_assessment: str

    class Config:
        from_attributes = True