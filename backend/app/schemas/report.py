from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ReportBase(BaseModel):
    generated_by: int
    title: str
    file_path: str

class ReportCreate(ReportBase):
    pass

class ReportInDBBase(ReportBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ReportResponse(ReportInDBBase):
    pass
