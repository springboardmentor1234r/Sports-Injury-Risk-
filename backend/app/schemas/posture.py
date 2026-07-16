from pydantic import BaseModel


class PostureRequest(BaseModel):
    video_folder: str


class PostureResponse(BaseModel):
    video_name: str
    posture_score: float
    posture: str
    output_file: str
    status: str