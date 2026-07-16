import os

from fastapi import APIRouter, HTTPException

from app.schemas.angle import (
    AngleAnalysisRequest,
    AngleAnalysisResponse
)

from app.services.joint_angle import JointAngleService

router = APIRouter(
    prefix="/angles",
    tags=["Joint Angle Analysis"]
)

service = JointAngleService()

BASE_DIR = os.getcwd()


@router.post(
    "/analyze",
    response_model=AngleAnalysisResponse
)
def analyze_angles(request: AngleAnalysisRequest):

    keypoints_folder = os.path.join(
        BASE_DIR,
        "keypoints",
        request.video_folder
    )

    output_folder = os.path.join(
        BASE_DIR,
        "angles",
        request.video_folder
    )

    if not os.path.exists(keypoints_folder):

        raise HTTPException(
            status_code=404,
            detail="Keypoints folder not found."
        )

    result = service.process(
        keypoints_folder,
        output_folder
    )

    return AngleAnalysisResponse(
        video_name=request.video_folder,
        frames_processed=result["frames_processed"],
        angles_calculated=True,
        output_file=result["output_file"],
        status="Completed"
    )