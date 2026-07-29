from pydantic import BaseModel


class InjuryReportCreate(BaseModel):
    injury_risk: float
    risk_level: str
    body_part: str
    recommendation: str


class InjuryReportResponse(BaseModel):
    id: int
    athlete_id: int
    injury_risk: float
    risk_level: str
    body_part: str
    recommendation: str

    class Config:
        from_attributes = True