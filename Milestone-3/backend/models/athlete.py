from pydantic import BaseModel


class Athlete(BaseModel):
    name: str
    age: int
    sport: str
    experience: str
    