from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Form,
    Depends,
    HTTPException,
)

from fastapi.responses import StreamingResponse

from sqlalchemy.orm import Session

from app.database.connection import get_db

from app.models.user import User
from app.models.video import Video
from app.models.injury_report import InjuryReport
from app.models.athlete_profile import AthleteProfile

from app.schemas.video_schema import VideoResponse

from app.utils.roles import (
    require_role,
    validate_role,
)

from app.utils.json_converter import convert_to_json

from app.services.pose_estimation import analyze_pose

from app.services.report_generator import generate_report


router = APIRouter(
    prefix="/video",
    tags=["Video Upload"],
)


UPLOAD_DIR = Path("uploads/videos")

ALLOWED_EXTENSIONS = {
    ".mp4",
    ".avi",
    ".mov",
    ".mkv",
    ".webm",
}


def _get_current_user(
    db: Session,
    current_user: dict,
) -> User:
    email = current_user.get("sub")

    if not email:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token.",
        )

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    return user


def _get_athlete_by_user(
    db: Session,
    user: User,
) -> AthleteProfile:
    athlete = (
        db.query(AthleteProfile)
        .filter(
            AthleteProfile.user_id == user.id
        )
        .first()
    )

    if not athlete:
        raise HTTPException(
            status_code=404,
            detail="Athlete profile not found.",
        )

    return athlete


def _get_athlete_by_id(
    db: Session,
    athlete_id: int,
) -> AthleteProfile:
    athlete = (
        db.query(AthleteProfile)
        .filter(
            AthleteProfile.id == athlete_id
        )
        .first()
    )

    if not athlete:
        raise HTTPException(
            status_code=404,
            detail="Athlete not found.",
        )

    return athlete


def _resolve_upload_athlete(
    db: Session,
    user: User,
    current_user: dict,
    athlete_id: int | None,
) -> AthleteProfile:
    role = validate_role(
        current_user.get("role")
    )

    if role == "athlete":
        athlete = _get_athlete_by_user(
            db,
            user,
        )

        if (
            athlete_id is not None
            and athlete_id != athlete.id
        ):
            raise HTTPException(
                status_code=403,
                detail=(
                    "Athletes can upload videos "
                    "only for themselves."
                ),
            )

        return athlete

    if role == "coach":
        if athlete_id is None:
            raise HTTPException(
                status_code=400,
                detail=(
                    "athlete_id is required when "
                    "a coach uploads a video."
                ),
            )

        return _get_athlete_by_id(
            db,
            athlete_id,
        )

    raise HTTPException(
        status_code=403,
        detail=(
            "Only athletes and coaches are "
            "allowed to upload videos."
        ),
    )


def _validate_video(
    file: UploadFile,
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Video filename is required.",
        )

    extension = (
        Path(file.filename)
        .suffix
        .lower()
    )

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported video format. "
                "Allowed formats: "
                "mp4, avi, mov, mkv, webm."
            ),
        )

    return extension


def _create_video_path(
    original_filename: str,
):
    original_path = Path(
        original_filename
    )

    safe_stem = (
        original_path.stem
        .replace(" ", "_")
        .replace("/", "_")
        .replace("\\", "_")
    )

    extension = (
        original_path.suffix.lower()
    )

    unique_name = (
        f"{safe_stem}_"
        f"{uuid4().hex[:10]}"
        f"{extension}"
    )

    UPLOAD_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    return UPLOAD_DIR / unique_name


def _extract_body_part(
    risk: dict,
):
    if not isinstance(risk, dict):
        return "General"

    factors = risk.get(
        "risk_factors",
        [],
    )

    if not isinstance(factors, list):
        factors = []

    text = " ".join(
        str(item)
        for item in factors
    ).lower()

    if "knee" in text:
        return "Knee"

    if "hip" in text:
        return "Hip"

    if "elbow" in text:
        return "Elbow"

    if "shoulder" in text:
        return "Shoulder"

    if "ankle" in text:
        return "Ankle"

    if "back" in text:
        return "Lower Back"

    return "General"


def _safe_number(
    value,
    default=0.0,
):
    try:
        if value is None:
            return default

        return float(value)

    except (
        TypeError,
        ValueError,
    ):
        return default


def _get_video_with_access(
    db: Session,
    video_id: int,
    user: User,
    current_user: dict,
) -> Video:
    role = validate_role(
        current_user.get("role")
    )

    video = (
        db.query(Video)
        .filter(
            Video.id == video_id
        )
        .first()
    )

    if not video:
        raise HTTPException(
            status_code=404,
            detail="Video not found.",
        )

    if role == "athlete":
        athlete = _get_athlete_by_user(
            db,
            user,
        )

        if video.athlete_id != athlete.id:
            raise HTTPException(
                status_code=403,
                detail=(
                    "You can access only "
                    "your own videos."
                ),
            )

    return video


@router.post(
    "/upload",
    response_model=VideoResponse,
)
def upload_video(
    file: UploadFile = File(...),
    athlete_id: int | None = Form(
        default=None
    ),
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role(
            "athlete",
            "coach",
        )
    ),
):
    user = _get_current_user(
        db,
        current_user,
    )

    athlete = _resolve_upload_athlete(
        db,
        user,
        current_user,
        athlete_id,
    )

    _validate_video(file)

    file_path = _create_video_path(
        file.filename
    )

    try:
        with open(
            file_path,
            "wb",
        ) as buffer:
            while True:
                chunk = file.file.read(
                    1024 * 1024
                )

                if not chunk:
                    break

                buffer.write(chunk)

    except Exception as error:
        if file_path.exists():
            try:
                file_path.unlink()
            except OSError:
                pass

        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to save video: {error}"
            ),
        )

    finally:
        try:
            file.file.close()
        except Exception:
            pass

    try:
        raw_analysis = analyze_pose(
            str(file_path),
            generate_video=True,
        )

        analysis = convert_to_json(
            raw_analysis
        )

    except Exception as error:
        if file_path.exists():
            try:
                file_path.unlink()
            except OSError:
                pass

        raise HTTPException(
            status_code=500,
            detail=(
                f"Video analysis failed: {error}"
            ),
        )

    try:
        new_video = Video(
            athlete_id=athlete.id,
            filename=file.filename,
            filepath=str(file_path),
            analysis=analysis,
        )

        db.add(new_video)
        db.commit()
        db.refresh(new_video)

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to save video "
                f"analysis: {error}"
            ),
        )

    risk = analysis.get(
        "risk_analysis",
        {},
    )

    biomechanics = analysis.get(
        "biomechanics",
        {},
    )

    recommendations = risk.get(
        "recommendations",
        [],
    )

    if not isinstance(
        recommendations,
        list,
    ):
        recommendations = []

    if recommendations:
        recommendation_text = ", ".join(
            str(item)
            for item in recommendations
        )
    else:
        recommendation_text = (
            "Continue monitoring "
            "movement quality."
        )

    body_part = _extract_body_part(
        risk
    )

    movement_quality = _safe_number(
        biomechanics.get(
            "movement_quality"
        )
    )

    balance_score = _safe_number(
        biomechanics.get(
            "balance_score"
        )
    )

    movement_symmetry = biomechanics.get(
        "movement_symmetry",
        {},
    )

    if not isinstance(
        movement_symmetry,
        dict,
    ):
        movement_symmetry = {}

    symmetry_score = _safe_number(
        movement_symmetry.get(
            "symmetry_score"
        )
    )

    range_of_motion = biomechanics.get(
        "range_of_motion",
        {},
    )

    if not isinstance(
        range_of_motion,
        dict,
    ):
        range_of_motion = {}

    average_rom = _safe_number(
        range_of_motion.get(
            "average_rom"
        )
    )

    try:
        report = InjuryReport(
            athlete_id=athlete.id,
            video_id=new_video.id,
            injury_risk=_safe_number(
                risk.get("risk_score")
            ),
            risk_level=risk.get(
                "risk_level",
                "Unknown",
            ),
            body_part=body_part,
            recommendation=recommendation_text,
            movement_quality=movement_quality,
            balance_score=balance_score,
            symmetry_score=symmetry_score,
            range_of_motion=average_rom,
            status="Pending",
        )

        db.add(report)
        db.commit()
        db.refresh(report)

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to create injury "
                f"report: {error}"
            ),
        )

    return {
        "id": new_video.id,
        "athlete_id": new_video.athlete_id,
        "filename": new_video.filename,
        "filepath": new_video.filepath,
        "uploaded_at": new_video.uploaded_at,
        "analysis": new_video.analysis,
    }


@router.get(
    "/report/{video_id}"
)
def download_report(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role(
            "athlete",
            "coach",
            "physiotherapist",
            "sports_scientist",
            "admin",
        )
    ),
):
    user = _get_current_user(
        db,
        current_user,
    )

    video = _get_video_with_access(
        db,
        video_id,
        user,
        current_user,
    )

    try:
        pdf = generate_report(video)

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to generate report: "
                f"{error}"
            ),
        )

    filename = (
        f"report_"
        f"{Path(video.filename).stem}.pdf"
    )

    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                f'attachment; filename="{filename}"'
        },
    )


@router.get("/history")
def get_video_history(
    athlete_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role(
            "athlete",
            "coach",
            "physiotherapist",
            "sports_scientist",
            "admin",
        )
    ),
):
    user = _get_current_user(
        db,
        current_user,
    )

    role = validate_role(
        current_user.get("role")
    )

    if role == "athlete":
        athlete = _get_athlete_by_user(
            db,
            user,
        )
    else:
        if athlete_id is None:
            raise HTTPException(
                status_code=400,
                detail=(
                    "athlete_id is required "
                    "for this role."
                ),
            )

        athlete = _get_athlete_by_id(
            db,
            athlete_id,
        )

    videos = (
        db.query(Video)
        .filter(
            Video.athlete_id == athlete.id
        )
        .order_by(
            Video.uploaded_at.desc()
        )
        .all()
    )

    history = []

    for video in videos:
        analysis = (
            video.analysis
            if isinstance(
                video.analysis,
                dict,
            )
            else {}
        )

        risk = analysis.get(
            "risk_analysis",
            {},
        )

        history.append(
            {
                "id": video.id,
                "athlete_id": video.athlete_id,
                "filename": video.filename,
                "filepath": video.filepath,
                "uploaded_at": video.uploaded_at,
                "has_analysis": bool(
                    video.analysis
                ),
                "risk_level": risk.get(
                    "risk_level"
                ),
                "risk_score": risk.get(
                    "risk_score"
                ),
            }
        )

    return history


@router.get(
    "/analysis/{video_id}"
)
def get_analysis(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role(
            "athlete",
            "coach",
            "physiotherapist",
            "sports_scientist",
            "admin",
        )
    ),
):
    user = _get_current_user(
        db,
        current_user,
    )

    video = _get_video_with_access(
        db,
        video_id,
        user,
        current_user,
    )

    return {
        "id": video.id,
        "athlete_id": video.athlete_id,
        "filename": video.filename,
        "filepath": video.filepath,
        "uploaded_at": video.uploaded_at,
        "analysis": video.analysis,
    }


@router.get("/dashboard")
def dashboard_summary(
    athlete_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role(
            "athlete",
            "coach",
            "physiotherapist",
            "sports_scientist",
            "admin",
        )
    ),
):
    user = _get_current_user(
        db,
        current_user,
    )

    role = validate_role(
        current_user.get("role")
    )

    if role == "athlete":
        athlete = _get_athlete_by_user(
            db,
            user,
        )
    else:
        if athlete_id is None:
            raise HTTPException(
                status_code=400,
                detail=(
                    "athlete_id is required "
                    "for this role."
                ),
            )

        athlete = _get_athlete_by_id(
            db,
            athlete_id,
        )

    videos = (
        db.query(Video)
        .filter(
            Video.athlete_id == athlete.id
        )
        .order_by(
            Video.uploaded_at.desc()
        )
        .all()
    )

    total_uploads = len(videos)
    total_analysis = 0
    risk_scores = []

    latest_video = (
        videos[0]
        if videos
        else None
    )

    for video in videos:
        analysis = (
            video.analysis
            if isinstance(
                video.analysis,
                dict,
            )
            else {}
        )

        if analysis:
            total_analysis += 1

        risk = analysis.get(
            "risk_analysis",
            {},
        )

        if isinstance(
            risk,
            dict,
        ):
            score = risk.get(
                "risk_score"
            )

            if score is not None:
                try:
                    risk_scores.append(
                        float(score)
                    )
                except (
                    TypeError,
                    ValueError,
                ):
                    pass

    current_risk = "Unknown"

    if latest_video:
        analysis = (
            latest_video.analysis
            if isinstance(
                latest_video.analysis,
                dict,
            )
            else {}
        )

        risk = analysis.get(
            "risk_analysis",
            {},
        )

        if isinstance(
            risk,
            dict,
        ):
            current_risk = risk.get(
                "risk_level",
                "Unknown",
            )

    average_risk = None

    if risk_scores:
        average_risk = round(
            sum(risk_scores)
            / len(risk_scores),
            2,
        )

    return {
        "athlete_id": athlete.id,
        "total_uploads": total_uploads,
        "total_analysis": total_analysis,
        "latest_video": (
            latest_video.filename
            if latest_video
            else None
        ),
        "current_risk": current_risk,
        "average_risk_score": average_risk,
    }