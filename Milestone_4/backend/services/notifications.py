"""
Milestone 4 — Notification & Alert System (PDF section 11)
Location: backend/services/notifications.py

Called from the video-processing pipeline right after the Milestone 3
injury risk engine finishes, so alerts are generated automatically —
no separate cron/worker needed for this project's scope.
"""

from typing import Optional, Any

from models import Notification


def create_notification(
    db,
    user_id: int,
    type: str,
    severity: str,
    title: str,
    message: str,
    video_id: Optional[int] = None,
    athlete_id: Optional[int] = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        video_id=video_id,
        athlete_id=athlete_id,
        type=type,
        severity=severity,
        title=title,
        message=message,
        is_read="no",
    )
    db.add(notification)
    return notification


def generate_notifications_for_risk_assessment(
    db,
    athlete_owner_user_id: int,
    video: Any,
    risk_data: dict,
) -> None:
    """
    Covers PDF section 11:
      - High-risk movement alerts
      - Injury risk notifications
      - Training load warnings
      - Recovery reminders
      - Assessment completion alerts

    Notifications go to the athlete who owns the video. (Coaches/physios
    already see the same signal via the Team Risk Overview / analytics
    dashboards added in Milestone 4, so this keeps the notification feed
    from duplicating across every assigned staff member.)
    """
    risk_category = risk_data.get("risk_category")
    overall_score = risk_data.get("overall_injury_risk_score")
    activity_label = (video.activity_type or "video").replace("_", " ")

    # 1. Assessment completion alert — always fires once processing finishes.
    create_notification(
        db,
        user_id=athlete_owner_user_id,
        type="assessment_completion",
        severity="info",
        title="Analysis complete",
        message=f"Your {activity_label} video has been analyzed — risk score {overall_score}/100 ({risk_category}).",
        video_id=video.id,
        athlete_id=video.athlete_id,
    )

    # 2 & 3. High-risk movement alert + injury risk notification.
    if risk_category in {"High", "Critical"}:
        create_notification(
            db,
            user_id=athlete_owner_user_id,
            type="high_risk_movement",
            severity="high" if risk_category == "Critical" else "moderate",
            title=f"{risk_category} injury risk detected",
            message=(
                f"Your latest {activity_label} clip scored {overall_score}/100 "
                f"({risk_category} risk). Check the Injury Risk Dashboard for recommendations."
            ),
            video_id=video.id,
            athlete_id=video.athlete_id,
        )

    # 4. Training load warning.
    training_load_score = risk_data.get("training_load_score")
    if training_load_score is not None and training_load_score > 70:
        create_notification(
            db,
            user_id=athlete_owner_user_id,
            type="training_load",
            severity="moderate",
            title="Training load looks high",
            message="Your reported training load is elevated relative to recovery — consider a deload week.",
            video_id=video.id,
            athlete_id=video.athlete_id,
        )

    # 5. Recovery reminder — fires when the Movement Anomaly Detection
    # Engine (Milestone 3) flagged fatigue in this clip.
    if risk_data.get("fatigue_detected") == "yes":
        create_notification(
            db,
            user_id=athlete_owner_user_id,
            type="recovery",
            severity="moderate",
            title="Recovery reminder",
            message="Form degraded later in your last session, a fatigue signature. Prioritize sleep, hydration, and rest.",
            video_id=video.id,
            athlete_id=video.athlete_id,
        )
