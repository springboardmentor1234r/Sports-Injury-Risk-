import os

from fastapi import APIRouter, HTTPException

from app.schemas.trajectory import (
    TrajectoryAnalysisRequest,
    TrajectoryAnalysisResponse
)

from app.services.trajectory import TrajectoryService

router = APIRouter(
    prefix="/trajectory",
    tags=["Trajectory Analysis"]
)

service = TrajectoryService()

BASE_DIR = os.getcwd()


@router.post("/analyze", response_model=TrajectoryAnalysisResponse)
def analyze_trajectory(request: TrajectoryAnalysisRequest):

    keypoints_folder = os.path.join(
        BASE_DIR,
        "keypoints",
        request.video_folder
    )

    output_folder = os.path.join(
        BASE_DIR,
        "trajectory",
        request.video_folder
    )

    if not os.path.exists(keypoints_folder):
        raise HTTPException(
            status_code=404,
            detail=f"Keypoints folder '{request.video_folder}' not found."
        )

    result = service.generate_trajectory(
        keypoints_folder,
        output_folder
    )

    return TrajectoryAnalysisResponse(
        video_name=request.video_folder,
        frames_processed=result["frames_processed"],
        trajectory_generated=True,
        joints_tracked=result["joints_tracked"],
        output_file=result["output_file"],
        status="Completed"
    )