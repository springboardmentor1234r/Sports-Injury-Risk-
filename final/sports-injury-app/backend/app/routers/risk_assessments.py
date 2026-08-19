"""
routers/risk_assessments.py
------------------------------
Triggers and retrieves injury risk assessments.

Write access (triggering a NEW assessment) mirrors physical assessments:
physiotherapist, sports_scientist, admin -- the clinical/analytical roles,
not coach. This is a deliberate judgment call, not a BRD requirement: a
computed risk score sits closer to a clinical screening judgment than a
coaching log entry, so it gets the same write-access tier as physical
assessments rather than the wider "any staff" tier used for viewing.

Read access follows the same pattern as every other athlete sub-resource:
the athlete themself (own data) plus any staff role.
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.permissions import require_profile_read_access, require_roles_for_write, get_athlete_profile_or_404
from app.services import risk_scoring

router = APIRouter(prefix="/athletes/{profile_id}/risk-assessments", tags=["Risk Assessment"])

WRITE_ROLES = (models.UserRole.physiotherapist, models.UserRole.sports_scientist, models.UserRole.admin)


def _latest_completed_video_analysis(db: Session, profile_id: uuid.UUID):
    """Returns (video, analysis_summary_dict) for the athlete's most recently
    completed video, or (None, None) if they have none."""
    from app.services import biomechanics

    video = (
        db.query(models.Video)
        .filter(models.Video.athlete_profile_id == profile_id, models.Video.status == models.VideoStatus.completed)
        .order_by(models.Video.processed_at.desc())
        .first()
    )
    if not video:
        return None, None

    frames = db.query(models.VideoFrame).filter(models.VideoFrame.video_id == video.id).all()
    frame_dicts = [
        {
            "left_knee_angle": f.left_knee_angle, "right_knee_angle": f.right_knee_angle,
            "left_hip_angle": f.left_hip_angle, "right_hip_angle": f.right_hip_angle,
            "left_elbow_angle": f.left_elbow_angle, "right_elbow_angle": f.right_elbow_angle,
            "trunk_lean_angle": f.trunk_lean_angle,
            "left_knee_deviation_angle": f.left_knee_deviation_angle,
            "right_knee_deviation_angle": f.right_knee_deviation_angle,
        }
        for f in frames
    ]
    return video, biomechanics.summarize_video(frame_dicts)


@router.post("", response_model=schemas.RiskAssessmentOut, status_code=201)
def create_risk_assessment(
    profile_id: uuid.UUID,
    current_user: models.User = Depends(require_roles_for_write(*WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    profile = get_athlete_profile_or_404(db, profile_id)

    video, analysis_summary = _latest_completed_video_analysis(db, profile_id)

    injury_records = db.query(models.InjuryRecord).filter(models.InjuryRecord.athlete_profile_id == profile_id).all()
    training_load_entries = db.query(models.TrainingLoadEntry).filter(models.TrainingLoadEntry.athlete_profile_id == profile_id).all()

    biomech_score, biomech_notes = risk_scoring.compute_biomechanical_score(analysis_summary) if analysis_summary else (None, ["No completed video analysis available for this athlete."])
    asymmetry_score, asymmetry_notes = risk_scoring.compute_asymmetry_score(analysis_summary) if analysis_summary else (None, ["No completed video analysis available for this athlete."])

    flagged_body_part = "knee" if biomech_score is not None and risk_scoring.score_to_band(biomech_score) in (models.RiskBand.high, models.RiskBand.critical) else None
    historical_score, historical_notes = risk_scoring.compute_historical_injury_score(injury_records, flagged_body_part=flagged_body_part)

    training_score, training_notes = risk_scoring.compute_training_load_score(training_load_entries)
    fatigue_score, fatigue_notes = risk_scoring.compute_fatigue_score(training_load_entries)

    sub_scores = {
        "biomechanical_score": biomech_score,
        "asymmetry_score": asymmetry_score,
        "historical_injury_score": historical_score,
        "training_load_score": training_score,
        "fatigue_score": fatigue_score,
    }
    overall, band, weight_warnings = risk_scoring.compute_overall_risk(sub_scores)

    breakdown = biomech_notes + asymmetry_notes + historical_notes + training_notes + fatigue_notes

    assessment = models.RiskAssessment(
        athlete_profile_id=profile.id,
        based_on_video_id=video.id if video else None,
        overall_score=overall,
        risk_band=band,
        biomechanical_score=biomech_score,
        asymmetry_score=asymmetry_score,
        historical_injury_score=historical_score,
        training_load_score=training_score,
        fatigue_score=fatigue_score,
        breakdown=breakdown,
        data_completeness_warnings=weight_warnings,
        computed_by_user_id=current_user.id,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment


@router.get("", response_model=list[schemas.RiskAssessmentOut])
def list_risk_assessments(
    profile: models.AthleteProfile = Depends(require_profile_read_access),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.RiskAssessment)
        .filter(models.RiskAssessment.athlete_profile_id == profile.id)
        .order_by(models.RiskAssessment.computed_at.desc())
        .all()
    )


@router.get("/latest", response_model=schemas.RiskAssessmentOut)
def get_latest_risk_assessment(
    profile: models.AthleteProfile = Depends(require_profile_read_access),
    db: Session = Depends(get_db),
):
    assessment = (
        db.query(models.RiskAssessment)
        .filter(models.RiskAssessment.athlete_profile_id == profile.id)
        .order_by(models.RiskAssessment.computed_at.desc())
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="No risk assessment has been computed for this athlete yet")
    return assessment
