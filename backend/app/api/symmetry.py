import os

from fastapi import APIRouter, HTTPException

from app.schemas.symmetry import (
    SymmetryRequest,
    SymmetryResponse
)

from app.services.symmetry import SymmetryService

router = APIRouter(
    prefix="/symmetry",
    tags=["Movement Symmetry"]
)

service = SymmetryService()

BASE_DIR = os.getcwd()


@router.post("/analyze", response_model=SymmetryResponse)
def analyze_symmetry(request: SymmetryRequest):

    angles_file = os.path.join(
        BASE_DIR,
        "angles",
        request.video_folder,
        "angles.json"
    )

    if not os.path.exists(angles_file):
        raise HTTPException(
            status_code=404,
            detail="angles.json not found"
        )

    output_folder = os.path.join(
        BASE_DIR,
        "symmetry",
        request.video_folder
    )

    result = service.analyze(
        angles_file,
        output_folder
    )

    return SymmetryResponse(
        video_name=request.video_folder,
        symmetry_score=result["symmetry_score"],
        output_file=result["output_file"],
        status="Completed"
    )