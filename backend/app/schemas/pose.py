from pydantic import BaseModel


class PoseAnalysisRequest(BaseModel):
    video_folder: str


class PoseAnalysisResponse(BaseModel):
    video_name: str
    frames_processed: int
    poses_detected: int
    keypoints_saved: int
    output_folder: str
    status: str