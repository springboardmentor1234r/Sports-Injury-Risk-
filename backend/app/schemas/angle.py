from pydantic import BaseModel


class AngleAnalysisRequest(BaseModel):
    video_folder: str


class AngleAnalysisResponse(BaseModel):
    video_name: str
    frames_processed: int
    angles_calculated: bool
    output_file: str
    status: str