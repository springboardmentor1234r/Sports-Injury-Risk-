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

    # If user has 0 notifications, seed contextual initial notifications (High-risk alert, training load warning, recovery reminder)
    if not notifications:
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
