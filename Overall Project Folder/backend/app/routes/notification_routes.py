from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("")
async def get_user_notifications(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("_id")
    db = get_db()
    notif_coll = db.get_collection("notifications")

    cursor = notif_coll.find({"user_id": user_id}).sort("created_at", -1)
    notifs = await cursor.to_list(100)

    for n in notifs:
        n["id"] = n.get("id") or n.get("_id")
    return notifs


@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    user_id = current_user.get("id") or current_user.get("_id")
    db = get_db()
    notif_coll = db.get_collection("notifications")

    await notif_coll.update_one(
        {"id": notification_id, "user_id": user_id},
        {"$set": {"is_read": True}}
    )
    return {"message": "Notification marked as read."}


@router.put("/read-all")
async def mark_all_notifications_read(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("_id")
    db = get_db()
    notif_coll = db.get_collection("notifications")

    await notif_coll.update_one(
        {"user_id": user_id},
        {"$set": {"is_read": True}}
    )
    return {"message": "All notifications marked as read."}
