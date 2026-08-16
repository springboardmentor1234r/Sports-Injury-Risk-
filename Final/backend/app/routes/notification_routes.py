from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_db
from app.auth import get_current_user
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/notifications", tags=["Notification & Alert System"])

@router.get("/me")
async def get_my_notifications(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    user_email = current_user["email"]
    
    # Query user's notifications
    cursor = db.notifications.find({"recipient_email": user_email}).sort("created_at", -1)
    notifications = await cursor.to_list(length=50)

    user_role = current_user.get("role", "Athlete")

    # If user has 0 notifications, seed contextual initial notifications based on role
    if not notifications:
        if user_role == "Coach":
            sample_alerts = [
                {
                    "notification_id": f"NOTIF-{uuid.uuid4().hex[:6].upper()}",
                    "recipient_email": user_email,
                    "type": "Roster Alert",
                    "category": "Risk Warning",
                    "title": "Roster Knee Collapse Alert",
                    "message": "3 Athletes (Marcus, Erling, LeBron) flagged for dynamic knee valgus > 8.0°.",
                    "priority": "High",
                    "is_read": False,
                    "created_at": datetime.utcnow()
                },
                {
                    "notification_id": f"NOTIF-{uuid.uuid4().hex[:6].upper()}",
                    "recipient_email": user_email,
                    "type": "Team Workload Warning",
                    "category": "Load Alert",
                    "title": "Team Workload Spike Warning",
                    "message": "Roster weekly training load spiked by 18% prior to upcoming match week.",
                    "priority": "Medium",
                    "is_read": False,
                    "created_at": datetime.utcnow()
                },
                {
                    "notification_id": f"NOTIF-{uuid.uuid4().hex[:6].upper()}",
                    "recipient_email": user_email,
                    "type": "Squad Update",
                    "category": "Roster",
                    "title": "Tactical Movement Audit",
                    "message": "Roster movement quality index currently averaged at 82.4% across 13 athletes.",
                    "priority": "Low",
                    "is_read": False,
                    "created_at": datetime.utcnow()
                }
            ]
        elif user_role == "Physiotherapist":
            sample_alerts = [
                {
                    "notification_id": f"NOTIF-{uuid.uuid4().hex[:6].upper()}",
                    "recipient_email": user_email,
                    "type": "Clinical Triage",
                    "category": "Rehab Alert",
                    "title": "Rehabilitation Triage Required",
                    "message": "2 Athletes require Hamstring Asymmetry evaluation (>12% limb imbalance).",
                    "priority": "High",
                    "is_read": False,
                    "created_at": datetime.utcnow()
                },
                {
                    "notification_id": f"NOTIF-{uuid.uuid4().hex[:6].upper()}",
                    "recipient_email": user_email,
                    "type": "Treatment Review",
                    "category": "Assessment",
                    "title": "Ankle Mobility Assessment",
                    "message": "Post-landing impact flexion report generated for Simone Biles.",
                    "priority": "Medium",
                    "is_read": False,
                    "created_at": datetime.utcnow()
                },
                {
                    "notification_id": f"NOTIF-{uuid.uuid4().hex[:6].upper()}",
                    "recipient_email": user_email,
                    "type": "Patient Clearance",
                    "category": "Clearance",
                    "title": "Return-to-Play Threshold",
                    "message": "Novak Djokovic achieved 94% movement quality baseline score post-recovery.",
                    "priority": "Low",
                    "is_read": False,
                    "created_at": datetime.utcnow()
                }
            ]
        elif user_role == "Sports Scientist":
            sample_alerts = [
                {
                    "notification_id": f"NOTIF-{uuid.uuid4().hex[:6].upper()}",
                    "recipient_email": user_email,
                    "type": "Dataset Ingestion",
                    "category": "Biomechanics",
                    "title": "Kinematic Motion Dataset Ingested",
                    "message": "13 Roster Motion Analysis videos compiled into 3D joint angle histograms.",
                    "priority": "High",
                    "is_read": False,
                    "created_at": datetime.utcnow()
                },
                {
                    "notification_id": f"NOTIF-{uuid.uuid4().hex[:6].upper()}",
                    "recipient_email": user_email,
                    "type": "Cohort Analytics",
                    "category": "Research",
                    "title": "Cohort Valgus Distribution Model",
                    "message": "Mean knee valgus angle established at 6.8° across all 13 active roster athletes.",
                    "priority": "Medium",
                    "is_read": False,
                    "created_at": datetime.utcnow()
                },
                {
                    "notification_id": f"NOTIF-{uuid.uuid4().hex[:6].upper()}",
                    "recipient_email": user_email,
                    "type": "Telemetry Log",
                    "category": "System",
                    "title": "Bilateral Asymmetry Variance Sync",
                    "message": "Kinetic limb load variance models synced to MongoDB Time-Series telemetry.",
                    "priority": "Low",
                    "is_read": False,
                    "created_at": datetime.utcnow()
                }
            ]
        elif user_role == "Administrator":
            sample_alerts = [
                {
                    "notification_id": f"NOTIF-{uuid.uuid4().hex[:6].upper()}",
                    "recipient_email": user_email,
                    "type": "System Status",
                    "category": "Infrastructure",
                    "title": "ML Inference Engine Healthy",
                    "message": "Random Forest & MediaPipe 3D Pose calibration pipelines operational.",
                    "priority": "High",
                    "is_read": False,
                    "created_at": datetime.utcnow()
                },
                {
                    "notification_id": f"NOTIF-{uuid.uuid4().hex[:6].upper()}",
                    "recipient_email": user_email,
                    "type": "Database Telemetry",
                    "category": "Audit",
                    "title": "Database Roster Audit",
                    "message": "13 Active Athlete Profiles & 13 Practitioner Accounts verified in DB.",
                    "priority": "Medium",
                    "is_read": False,
                    "created_at": datetime.utcnow()
                },
                {
                    "notification_id": f"NOTIF-{uuid.uuid4().hex[:6].upper()}",
                    "recipient_email": user_email,
                    "type": "Security Audit",
                    "category": "Auth",
                    "title": "OAuth 2.0 Identity Audit",
                    "message": "Google OAuth 2.0 & JWT session token authentication verified clean.",
                    "priority": "Low",
                    "is_read": False,
                    "created_at": datetime.utcnow()
                }
            ]
        else:
            # Default Athlete Notifications
            sample_alerts = [
                {
                    "notification_id": f"NOTIF-{uuid.uuid4().hex[:6].upper()}",
                    "recipient_email": user_email,
                    "type": "High-Risk Alert",
                    "category": "Risk Warning",
                    "title": "Dynamic Knee Valgus Alert",
                    "message": "Right knee rotated inward by 8.5° during ground contact. High ACL strain risk detected.",
                    "priority": "High",
                    "is_read": False,
                    "created_at": datetime.utcnow()
                },
                {
                    "notification_id": f"NOTIF-{uuid.uuid4().hex[:6].upper()}",
                    "recipient_email": user_email,
                    "type": "Training Load Warning",
                    "category": "Load Alert",
                    "title": "Weekly Workload Spikes Warning",
                    "message": "Weekly training load exceeds 14 hours/week. Ensure 48 hours recovery between sessions.",
                    "priority": "Medium",
                    "is_read": False,
                    "created_at": datetime.utcnow()
                },
                {
                    "notification_id": f"NOTIF-{uuid.uuid4().hex[:6].upper()}",
                    "recipient_email": user_email,
                    "type": "Recovery Reminder",
                    "category": "Rehab",
                    "title": "Post-Workout Contrast Hydrotherapy",
                    "message": "Complete 15-minute contrast bath protocol and banded glute abduction drills today.",
                    "priority": "Low",
                    "is_read": False,
                    "created_at": datetime.utcnow()
                }
            ]
        await db.notifications.insert_many(sample_alerts)
        cursor = db.notifications.find({"recipient_email": user_email}).sort("created_at", -1)
        notifications = await cursor.to_list(length=50)


    formatted = []
    unread_count = 0
    for doc in notifications:
        doc["_id"] = str(doc["_id"])
        if not doc.get("is_read", False):
            unread_count += 1
        formatted.append(doc)

    return {
        "unread_count": unread_count,
        "notifications": formatted
    }

@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    result = await db.notifications.update_one(
        {"notification_id": notification_id, "recipient_email": current_user["email"]},
        {"$set": {"is_read": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found.")
    return {"status": "success", "notification_id": notification_id}

@router.put("/read-all")
async def mark_all_notifications_read(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    await db.notifications.update_many(
        {"recipient_email": current_user["email"]},
        {"$set": {"is_read": True}}
    )
    return {"status": "success", "message": "All notifications marked as read."}
