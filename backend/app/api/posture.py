import os

from fastapi import APIRouter, HTTPException

from app.schemas.posture import (
    PostureRequest,
    PostureResponse
)

from app.services.posture import PostureAssessmentService


router = APIRouter(
    prefix="/posture",
    tags=["Posture Assessment"]
)

service = PostureAssessmentService()

BASE_DIR = os.getcwd()


@router.post("/analyze", response_model=PostureResponse)
def analyze_posture(request: PostureRequest):

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
        "posture",
        request.video_folder
    )

    result = service.analyze(
        angles_file,
        output_folder
    )

    return PostureResponse(
        video_name=request.video_folder,
        posture_score=result["posture_score"],
        posture=result["posture"],
        output_file=result["output_file"],
        status="Completed"
    )