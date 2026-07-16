import os

from fastapi import APIRouter, HTTPException

from app.schemas.rom import ROMRequest, ROMResponse
from app.services.rom import RangeOfMotionService

router = APIRouter(
    prefix="/rom",
    tags=["Range of Motion Analysis"]
)

service = RangeOfMotionService()

BASE_DIR = os.getcwd()


@router.post("/analyze", response_model=ROMResponse)
def analyze_rom(request: ROMRequest):

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
        "rom",
        request.video_folder
    )

    result = service.analyze(
        angles_file,
        output_folder
    )

    return ROMResponse(
        video_name=request.video_folder,
        joints_analyzed=result["joints_analyzed"],
        output_file=result["output_file"],
        status="Completed"
    )