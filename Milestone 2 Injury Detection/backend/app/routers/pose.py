from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, AthleteProfile, PoseAnalysis, RoleEnum
from app.schemas import PoseAnalysisOut
from app.dependencies import get_current_user
from app.pose_utils import analyze_image

router = APIRouter(prefix="/api/pose", tags=["Pose Estimation & Biomechanics"])

STAFF_ROLES = (
    RoleEnum.coach,
    RoleEnum.physiotherapist,
    RoleEnum.sports_scientist,
    RoleEnum.administrator,
)

MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8 MB
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/jpg"}


def _to_out(record: PoseAnalysis) -> PoseAnalysisOut:
    image_url = f"/uploads/{record.annotated_image_path}" if record.annotated_image_path else None
    return PoseAnalysisOut(
        id=record.id,
        created_at=record.created_at,
        source_filename=record.source_filename,
        annotated_image_url=image_url,
        joint_angles=record.joint_angles,
        asymmetry=record.asymmetry,
        risk_flags=record.risk_flags,
        landmark_confidence=record.landmark_confidence,
    )


def _resolve_target_profile(
    db: Session, current_user: User, athlete_profile_id: Optional[int]
) -> AthleteProfile:
    """
    Athletes always analyze their own profile. Staff roles must specify
    which athlete_profile_id the analysis belongs to.
    """
    if current_user.role == RoleEnum.athlete:
        profile = (
            db.query(AthleteProfile)
            .filter(AthleteProfile.user_id == current_user.id)
            .first()
        )
        if not profile:
            raise HTTPException(status_code=404, detail="No athlete profile found for your account")
        return profile

    if athlete_profile_id is None:
        raise HTTPException(
            status_code=400,
            detail="athlete_profile_id is required for staff-submitted analyses",
        )
    profile = db.query(AthleteProfile).filter(AthleteProfile.id == athlete_profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Athlete profile not found")
    return profile


@router.post("/analyze", response_model=PoseAnalysisOut, status_code=status.HTTP_201_CREATED)
async def analyze_pose(
    file: UploadFile = File(...),
    athlete_profile_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPG or PNG images are supported for pose analysis",
        )

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="Image too large (max 8MB)")

    profile = _resolve_target_profile(db, current_user, athlete_profile_id)

    try:
        result = analyze_image(contents, file.filename or "upload.jpg")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if result is None:
        raise HTTPException(
            status_code=422,
            detail="No person could be detected in this image. Try a clearer, full-body photo.",
        )

    record = PoseAnalysis(
        athlete_profile_id=profile.id,
        source_filename=file.filename,
        annotated_image_path=result["annotated_image_filename"],
        joint_angles=result["joint_angles"],
        asymmetry=result["asymmetry"],
        risk_flags=result["risk_flags"],
        landmark_confidence=result["landmark_confidence"],
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return _to_out(record)


@router.get("/history/me", response_model=List[PoseAnalysisOut])
def get_my_pose_history(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    profile = (
        db.query(AthleteProfile)
        .filter(AthleteProfile.user_id == current_user.id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="No athlete profile found for your account")
    return [_to_out(r) for r in profile.pose_analyses]


@router.get("/history/{profile_id}", response_model=List[PoseAnalysisOut])
def get_pose_history(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(AthleteProfile).filter(AthleteProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Athlete profile not found")

    is_owner = profile.user_id == current_user.id
    is_staff = current_user.role in STAFF_ROLES
    if not (is_owner or is_staff):
        raise HTTPException(status_code=403, detail="You do not have access to this athlete's data")

    return [_to_out(r) for r in profile.pose_analyses]
