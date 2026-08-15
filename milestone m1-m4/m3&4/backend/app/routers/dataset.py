from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from app import schemas, auth, models

router = APIRouter(prefix="/api/datasets", tags=["Dataset Integration"])

# Standard static dataset descriptions and schemas for Pose Estimation
DATASETS_DB: Dict[str, Dict[str, Any]] = {
    "human3.6m": {
        "name": "Human3.6M",
        "description": "Large-scale 3D human pose dataset featuring 3.6 million human poses. Includes multi-camera setups, motion capture, and indoor studio environments.",
        "keypoints_count": 32,
        "joints_format": "3D (X, Y, Z)",
        "total_images_videos": "3.6M frames",
        "sample_annotation_structure": {
            "subject": "S1",
            "action": "Directions",
            "camera": "55011271",
            "frame_idx": 15,
            "joint_coordinates_3d": [
                [0.12, 0.45, 1.2], [0.15, 0.42, 0.9], "..."
            ]
        }
    },
    "mpii": {
        "name": "MPII Human Pose",
        "description": "State-of-the-art 2D human pose estimation dataset featuring 25,000 images containing over 40,000 humans with annotated body joints.",
        "keypoints_count": 16,
        "joints_format": "2D (X, Y)",
        "total_images_videos": "25,000 images",
        "sample_annotation_structure": {
            "image_name": "012345678.jpg",
            "scale": 2.0,
            "objpos": [235, 180],
            "joint_coordinates_2d": [
                {"joint_id": 0, "x": 120, "y": 240, "visible": 1}, "..."
            ]
        }
    },
    "coco": {
        "name": "COCO Keypoints",
        "description": "Common Objects in Context (COCO) keypoint detection task dataset. Standardized for general 2D human pose estimation in the wild.",
        "keypoints_count": 17,
        "joints_format": "2D (X, Y, Visibility)",
        "total_images_videos": "200,000+ images",
        "sample_annotation_structure": {
            "image_id": 391895,
            "category_id": 1,
            "keypoints": [
                244, 189, 2, 256, 180, 2, 0, 0, 0, "..."
            ],
            "num_keypoints": 15,
            "bbox": [156, 110, 280, 430]
        }
    },
    "sportspose": {
        "name": "SportsPose",
        "description": "Specific human pose dataset focused on athletic movements (running, jumping, kicking). Ideal for evaluating biomechanics and training load kinematics.",
        "keypoints_count": 16,
        "joints_format": "3D (camera-relative X, Y, Z)",
        "total_images_videos": "100,000+ frames",
        "sample_annotation_structure": {
            "sport": "Tennis",
            "movement": "Forehand",
            "athlete_height": 182,
            "keypoint_annotations": [
                {"name": "r_ankle", "pos_3d": [0.4, 0.1, 0.05]}, "..."
            ]
        }
    }
}

@router.get("", response_model=List[schemas.DatasetInfo])
def get_all_dataset_info(current_user: models.User = Depends(auth.get_current_user)):
    # Requires active login to view dataset documentation structures
    results = []
    for key, value in DATASETS_DB.items():
        results.append(schemas.DatasetInfo(
            name=value["name"],
            description=value["description"],
            keypoints_count=value["keypoints_count"],
            joints_format=value["joints_format"],
            total_images_videos=value["total_images_videos"],
            sample_annotation_structure=value["sample_annotation_structure"]
        ))
    return results

@router.get("/{dataset_id}", response_model=schemas.DatasetInfo)
def get_dataset_by_id(dataset_id: str, current_user: models.User = Depends(auth.get_current_user)):
    ds_id = dataset_id.lower().strip()
    if ds_id not in DATASETS_DB:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset '{dataset_id}' not found. Choose from: {list(DATASETS_DB.keys())}"
        )
    val = DATASETS_DB[ds_id]
    return schemas.DatasetInfo(
        name=val["name"],
        description=val["description"],
        keypoints_count=val["keypoints_count"],
        joints_format=val["joints_format"],
        total_images_videos=val["total_images_videos"],
        sample_annotation_structure=val["sample_annotation_structure"]
    )

@router.post("/mock-ingest/{dataset_id}")
def mock_ingest_dataset_sample(
    dataset_id: str,
    sample_count: int = 10,
    current_user: models.User = Depends(auth.RoleChecker(["admin", "coach"]))
):
    """
    Simulates importing images/videos from one of the major datasets (Human3.6M, MPII, COCO, SportsPose)
    for model fine-tuning or analysis mapping. Admin/Coach permissions required.
    """
    ds_id = dataset_id.lower().strip()
    if ds_id not in DATASETS_DB:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset '{dataset_id}' not found."
        )
        
    ds_name = DATASETS_DB[ds_id]["name"]
    return {
        "status": "success",
        "message": f"Successfully ingested {sample_count} annotative samples from {ds_name} repository.",
        "ingested_samples_metadata": [
            {
                "local_ref_id": f"mock_ref_{ds_id}_{i}",
                "annotation_type": DATASETS_DB[ds_id]["joints_format"],
                "mapped_keypoints_shape": [DATASETS_DB[ds_id]["keypoints_count"], 3 if "3D" in DATASETS_DB[ds_id]["joints_format"] else 2]
            }
            for i in range(sample_count)
        ]
    }
