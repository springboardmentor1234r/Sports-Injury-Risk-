from pydantic import BaseModel


class SymmetryRequest(BaseModel):
    video_folder: str


class SymmetryResponse(BaseModel):
    video_name: str
    symmetry_score: float
    output_file: str
    status: str