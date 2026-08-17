from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from app.schemas import AthleteCreate, AthleteUpdate, AthleteResponse
from app.models import create_athlete_model
from app.database import get_db
from app.dependencies import get_current_user, require_roles, verify_athlete_access

router = APIRouter(prefix="/api/athletes", tags=["Athletes"])

@router.get("", response_model=List[AthleteResponse])
async def get_all_athletes(
    search: Optional[str] = Query(None, description="Search by name or sport"),
    sport: Optional[str] = Query(None, description="Filter by sport type"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Returns list of athletes.
    If current user is an Athlete, returns ONLY their own profile.
    If current user is Coach/Physio/Scientist/Admin, returns ALL registered athletes.
    """
    db = get_db()
    athletes_coll = db.get_collection("athletes")
    
    user_role = current_user.get("role", "").lower()
    
    query = {}
    if user_role == "athlete":
        user_id = current_user.get("id") or current_user.get("_id")
        query["user_id"] = user_id
    else:
        if sport and sport.lower() != "all":
            query["sport_type"] = {"$regex": sport, "$options": "i"}

    cursor = athletes_coll.find(query)
    athletes = await cursor.to_list(1000)
    
    # Filter search in memory if needed
    if search:
        search_lower = search.lower()
        athletes = [
            a for a in athletes
            if search_lower in a.get("name", "").lower() or search_lower in a.get("sport_type", "").lower()
        ]

    # Map to response model
    result = []
    for a in athletes:
        a_id = a.get("id") or a.get("_id")
        result.append(AthleteResponse(
            id=a_id,
            user_id=a.get("user_id"),
            name=a.get("name", "Unknown Athlete"),
            sport_type=a.get("sport_type", "General"),
            position=a.get("position", "General"),
            age=a.get("age", 22),
            height=a.get("height", 175.0),
            weight=a.get("weight", 70.0),
            injury_history=a.get("injury_history", "None reported"),
            training_load=a.get("training_load", "Moderate"),
            recent_risk_score=a.get("recent_risk_score", 24.5),
            risk_level=a.get("risk_level", "Low"),
            movement_quality_score=a.get("movement_quality_score", 84.0),
            overall_health_score=a.get("overall_health_score", 88.0),
            sessions_analyzed=a.get("sessions_analyzed", 0),
            profile_image=a.get("profile_image"),
            created_at=a.get("created_at", "")
        ))
    return result


@router.get("/me", response_model=AthleteResponse)
async def get_my_athlete_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("_id")
    db = get_db()
    athletes_coll = db.get_collection("athletes")
    
    athlete = await athletes_coll.find_one({"user_id": user_id})
    if not athlete:
        athlete = await athletes_coll.find_one({"email": current_user.get("email")})
        
    if not athlete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No athlete profile linked to current user account."
        )

    a_id = athlete.get("id") or athlete.get("_id")
    return AthleteResponse(
        id=a_id,
        user_id=athlete.get("user_id"),
        name=athlete.get("name", "Unknown Athlete"),
        sport_type=athlete.get("sport_type", "General"),
        position=athlete.get("position", "General"),
        age=athlete.get("age", 22),
        height=athlete.get("height", 175.0),
        weight=athlete.get("weight", 70.0),
        injury_history=athlete.get("injury_history", "None reported"),
        training_load=athlete.get("training_load", "Moderate"),
        recent_risk_score=athlete.get("recent_risk_score", 24.5),
        risk_level=athlete.get("risk_level", "Low"),
        movement_quality_score=athlete.get("movement_quality_score", 84.0),
        overall_health_score=athlete.get("overall_health_score", 88.0),
        sessions_analyzed=athlete.get("sessions_analyzed", 0),
        profile_image=athlete.get("profile_image"),
        created_at=athlete.get("created_at", "")
    )


@router.get("/{athlete_id}", response_model=AthleteResponse)
async def get_athlete_by_id(
    athlete_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    CRITICAL SECURITY CHECK:
    Verifies that if user is an athlete, they are accessing ONLY their own athlete_id.
    Otherwise returns 403 Forbidden.
    """
    await verify_athlete_access(athlete_id, current_user)

    db = get_db()
    athletes_coll = db.get_collection("athletes")
    
    athlete = await athletes_coll.find_one({"id": athlete_id})
    if not athlete:
        athlete = await athletes_coll.find_one({"_id": athlete_id})

    if not athlete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Athlete profile not found.")

    a_id = athlete.get("id") or athlete.get("_id")
    return AthleteResponse(
        id=a_id,
        user_id=athlete.get("user_id"),
        name=athlete.get("name", "Unknown Athlete"),
        sport_type=athlete.get("sport_type", "General"),
        position=athlete.get("position", "General"),
        age=athlete.get("age", 22),
        height=athlete.get("height", 175.0),
        weight=athlete.get("weight", 70.0),
        injury_history=athlete.get("injury_history", "None reported"),
        training_load=athlete.get("training_load", "Moderate"),
        recent_risk_score=athlete.get("recent_risk_score", 24.5),
        risk_level=athlete.get("risk_level", "Low"),
        movement_quality_score=athlete.get("movement_quality_score", 84.0),
        overall_health_score=athlete.get("overall_health_score", 88.0),
        sessions_analyzed=athlete.get("sessions_analyzed", 0),
        profile_image=athlete.get("profile_image"),
        created_at=athlete.get("created_at", "")
    )


@router.post("", response_model=AthleteResponse)
async def create_athlete(
    athlete_in: AthleteCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    db = get_db()
    athletes_coll = db.get_collection("athletes")

    user_id = athlete_in.user_id or current_user.get("id") or current_user.get("_id")
    athlete_dict = create_athlete_model(
        name=athlete_in.name,
        sport_type=athlete_in.sport_type,
        position=athlete_in.position or "General",
        age=athlete_in.age,
        height=athlete_in.height,
        weight=athlete_in.weight,
        injury_history=athlete_in.injury_history or "None reported",
        training_load=athlete_in.training_load or "Moderate",
        user_id=user_id
    )

    await athletes_coll.insert_one(athlete_dict)

    a_id = athlete_dict["id"]
    return AthleteResponse(
        id=a_id,
        user_id=athlete_dict.get("user_id"),
        name=athlete_dict["name"],
        sport_type=athlete_dict["sport_type"],
        position=athlete_dict["position"],
        age=athlete_dict["age"],
        height=athlete_dict["height"],
        weight=athlete_dict["weight"],
        injury_history=athlete_dict["injury_history"],
        training_load=athlete_dict["training_load"],
        recent_risk_score=athlete_dict["recent_risk_score"],
        risk_level=athlete_dict["risk_level"],
        movement_quality_score=athlete_dict["movement_quality_score"],
        overall_health_score=athlete_dict["overall_health_score"],
        sessions_analyzed=0,
        profile_image=None,
        created_at=athlete_dict["created_at"]
    )


@router.put("/{athlete_id}", response_model=AthleteResponse)
async def update_athlete(
    athlete_id: str,
    athlete_in: AthleteUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    await verify_athlete_access(athlete_id, current_user)

    db = get_db()
    athletes_coll = db.get_collection("athletes")
    
    update_data = {k: v for k, v in athlete_in.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields provided for update.")

    await athletes_coll.update_one({"id": athlete_id}, {"$set": update_data})
    
    athlete = await athletes_coll.find_one({"id": athlete_id})
    if not athlete:
        athlete = await athletes_coll.find_one({"_id": athlete_id})

    a_id = athlete.get("id") or athlete.get("_id")
    return AthleteResponse(
        id=a_id,
        user_id=athlete.get("user_id"),
        name=athlete.get("name", ""),
        sport_type=athlete.get("sport_type", ""),
        position=athlete.get("position", ""),
        age=athlete.get("age", 20),
        height=athlete.get("height", 170.0),
        weight=athlete.get("weight", 70.0),
        injury_history=athlete.get("injury_history", ""),
        training_load=athlete.get("training_load", ""),
        recent_risk_score=athlete.get("recent_risk_score", 20.0),
        risk_level=athlete.get("risk_level", "Low"),
        movement_quality_score=athlete.get("movement_quality_score", 80.0),
        overall_health_score=athlete.get("overall_health_score", 85.0),
        sessions_analyzed=athlete.get("sessions_analyzed", 0),
        profile_image=athlete.get("profile_image"),
        created_at=athlete.get("created_at", "")
    )


@router.delete("/{athlete_id}")
async def delete_athlete(
    athlete_id: str,
    current_user: Dict[str, Any] = Depends(require_roles(["coach", "admin"]))
):
    db = get_db()
    athletes_coll = db.get_collection("athletes")
    await athletes_coll.delete_one({"id": athlete_id})
    return {"message": f"Athlete profile {athlete_id} successfully deleted."}
