from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List
from api.dependencies import get_current_user
from database.mongo_utils import get_chat_history, mark_messages_as_read
from database.sql_utils import get_athlete_coach, get_assigned_athletes

router = APIRouter(prefix="/api/chat", tags=["chat"])

def verify_relationship(user_id: int, contact_id: int, roles: list) -> bool:
    """Verifies that the user and contact have a valid coach-athlete relationship."""
    if "coach" in roles:
        # Verify contact_id is an athlete belonging to this coach
        athletes = get_assigned_athletes(user_id)
        if any(a.get("id") == contact_id for a in athletes):
            return True
    
    if "athlete" in roles:
        # Verify contact_id is the coach of this athlete
        coach = get_athlete_coach(user_id)
        if coach and coach.get("id") == contact_id:
            return True
            
    return False

@router.get("/history/{contact_id}")
def fetch_chat_history(contact_id: int, limit: int = Query(50, le=200), current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = int(current_user["user_id"])
    roles = current_user.get("roles", [])
    
    if not verify_relationship(user_id, contact_id, roles):
        raise HTTPException(status_code=403, detail="Not authorized to chat with this user.")
        
    messages = get_chat_history(user_id, contact_id, limit)
    
    # Optional: Since the user just opened the chat to get history, we can mark unread messages from the contact as read
    # But usually, it's better to let the frontend trigger this explicitly via WebSocket or a dedicated endpoint.
    return {"messages": messages}

@router.post("/read/{contact_id}")
def mark_as_read(contact_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = int(current_user["user_id"])
    roles = current_user.get("roles", [])
    
    if not verify_relationship(user_id, contact_id, roles):
        raise HTTPException(status_code=403, detail="Not authorized to chat with this user.")
        
    # Mark messages sent BY contact_id TO user_id as read
    updated_count = mark_messages_as_read(sender_id=contact_id, receiver_id=user_id)
    return {"status": "success", "updated_count": updated_count}

@router.get("/my-coach")
def fetch_my_coach(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = int(current_user["user_id"])
    coach = get_athlete_coach(user_id)
    if not coach:
        raise HTTPException(status_code=404, detail="No coach assigned.")
    
    # Map coach_name to full_name for the frontend
    coach["full_name"] = coach.get("coach_name")
    return coach

@router.get("/unread")
def fetch_unread_counts(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = int(current_user["user_id"])
    from database.mongo_utils import get_unread_chat_counts
    counts = get_unread_chat_counts(user_id)
    total = sum(counts.values())
    return {"total_unread": total, "counts_by_sender": counts}
