from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class PipelineStatus(BaseModel):
    session_id: str
    status: str = Field(..., description="PENDING, PROCESSING, COMPLETED, FAILED")
    stage: str = Field(..., description="Current running stage name")
    progress: int = Field(..., ge=0, le=100, description="Progress percentage [0, 100]")
    message: str = Field(..., description="User-facing status message")
    error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True

class PipelineProgress(BaseModel):
    session_id: str
    status: str
    stage: str
    progress: int
    message: str

class PipelineResult(BaseModel):
    status: str
    anomalies_count: int
    predictions_count: int
    has_score: bool
    recommendations_count: int
    timestamp: datetime

class PipelineError(BaseModel):
    detail: str
    error_code: Optional[str] = None
