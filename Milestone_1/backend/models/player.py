from pydantic import BaseModel

class PlayerData(BaseModel):
    name: str
    age: int
    height: float
    weight: float
    sport: str