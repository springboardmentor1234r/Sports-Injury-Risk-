import os

from fastapi import APIRouter, HTTPException

from app.schemas.pose import (
    PoseAnalysisRequest,
    PoseAnalysisResponse,
)
from app.services.pose_estimation import PoseEstimationService

router = APIRouter(
    prefix="/pose",
    tags=["Pose Estimation"]
)

service = PoseEstimationService()

BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)


@router.post("/analyze", response_model=PoseAnalysisResponse)
def analyze_pose(request: PoseAnalysisRequest):

    input_folder = os.path.join(
        BASE_DIR,
        "processed_frames",
        request.video_folder
    )

    output_folder = os.path.join(
        BASE_DIR,
        "pose_frames",
        request.video_folder
    )

    keypoints_folder = os.path.join(
        BASE_DIR,
        "keypoints",
        request.video_folder
    )

    if not os.path.exists(input_folder):
        raise HTTPException(
            status_code=404,
            detail=f"Video folder '{request.video_folder}' not found."
        )

    result = service.process_frames(
        input_folder,
        output_folder,
        keypoints_folder
    )

    return PoseAnalysisResponse(
        video_name=request.video_folder,
        frames_processed=result["frames_processed"],
        poses_detected=result["poses_detected"],
        keypoints_saved=result["keypoints_saved"],
        output_folder=output_folder,
        keypoints_folder=keypoints_folder,
        status="Completed"
    )