from fastapi import APIRouter, Depends, HTTPException, Query, Body
from typing import List, Optional, Dict, Any
from app.database import get_db
from app.dependencies import get_current_user, verify_athlete_access

router = APIRouter(prefix="/api/recommendations", tags=["AI Recommendations"])

@router.get("")
async def get_recommendations(
    athlete_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    db = get_db()
    recs_coll = db.get_collection("recommendations")

    user_role = current_user.get("role", "").lower()
    query = {}

    if user_role == "athlete":
        my_athlete_id = current_user.get("athlete_id")
        if not my_athlete_id:
            athletes_coll = db.get_collection("athletes")
            my_ath = await athletes_coll.find_one({"user_id": current_user.get("id")})
            my_athlete_id = my_ath.get("id") if my_ath else None
        query["athlete_id"] = my_athlete_id
    elif athlete_id:
        query["athlete_id"] = athlete_id

    if category and category.lower() != "all":
        query["category"] = {"$regex": category, "$options": "i"}

    if priority and priority.lower() != "all":
        query["priority"] = {"$regex": priority, "$options": "i"}

    if status and status.lower() != "all":
        query["status"] = {"$regex": status, "$options": "i"}

    cursor = recs_coll.find(query)
    recs = await cursor.to_list(1000)

    for r in recs:
        r["id"] = r.get("id") or r.get("_id")
    return recs


@router.put("/{recommendation_id}/status")
async def update_recommendation_status(
    recommendation_id: str,
    status_val: str = Body(..., embed=True),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    db = get_db()
    recs_coll = db.get_collection("recommendations")

    rec = await recs_coll.find_one({"id": recommendation_id})
    if not rec:
        rec = await recs_coll.find_one({"_id": recommendation_id})

    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation item not found.")

    if current_user.get("role", "").lower() == "athlete":
        await verify_athlete_access(rec.get("athlete_id"), current_user)

    valid_statuses = ["Pending", "In Progress", "Completed"]
    if status_val not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status '{status_val}'. Must be one of {valid_statuses}")

    await recs_coll.update_one({"id": recommendation_id}, {"$set": {"status": status_val}})
    rec["status"] = status_val
    rec["id"] = rec.get("id") or rec.get("_id")
    return rec
