from pydantic import BaseModel


class ROMRequest(BaseModel):
    video_folder: str


class ROMResponse(BaseModel):
    video_name: str
    joints_analyzed: int
    output_file: str
    status: str