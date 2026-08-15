from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_db
from app.auth import get_current_user
from app.schemas import CustomRecommendationCreate
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])

@router.get("/{athlete_id}")
async def get_athlete_recommendations(
    athlete_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    target_athlete_id = athlete_id
    if target_athlete_id == "me":
        athlete_profile = await db.athlete_profiles.find_one({"email": current_user["email"]})
        if not athlete_profile:
            return {"automated": [], "coach_custom": []}
        target_athlete_id = athlete_profile["athlete_id"]

    # Fetch latest automated report
    latest_report = await db.predictions.find_one(
        {"athlete_id": target_athlete_id},
        sort=[("created_at", -1)]
    )

    automated_recs = latest_report.get("recommendations", []) if latest_report else []

    # Fetch coach custom recommendations
    cursor = db.custom_recommendations.find({"athlete_id": target_athlete_id}).sort("created_at", -1)
    custom_recs = await cursor.to_list(length=50)

    for c in custom_recs:
        c["_id"] = str(c["_id"])

    return {
        "automated": automated_recs,
        "coach_custom": custom_recs
    }

@router.post("/custom", status_code=status.HTTP_201_CREATED)
async def create_custom_recommendation(
    rec_data: CustomRecommendationCreate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Allows Coaches and Physiotherapists to prescribe custom drills & notes for an assigned athlete."""
    role = current_user.get("role")
    if role not in ["Coach", "Physiotherapist"]:
        raise HTTPException(
            status_code=403,
            detail="Only Coaches and Physiotherapists can create custom recommendations."
        )

    doc = {
        "rec_id": f"CUS-{uuid.uuid4().hex[:6].upper()}",
        "athlete_id": rec_data.athlete_id,
        "prescribed_by": current_user["fullname"],
        "author_role": role,
        "title": rec_data.title,
        "category": rec_data.category,
        "exercise_type": rec_data.exercise_type,
        "priority": rec_data.priority,
        "body_region": rec_data.body_region,
        "description": rec_data.description,
        "duration": rec_data.duration,
        "frequency": rec_data.frequency,
        "created_at": datetime.utcnow()
    }

    await db.custom_recommendations.insert_one(doc)
    doc["_id"] = str(doc["_id"])
    return doc
