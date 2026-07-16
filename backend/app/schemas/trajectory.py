from pydantic import BaseModel


class TrajectoryAnalysisRequest(BaseModel):
    video_folder: str


class TrajectoryAnalysisResponse(BaseModel):
    video_name: str
    frames_processed: int
    trajectory_generated: bool
    joints_tracked: list[str]
    output_file: str
    status: str