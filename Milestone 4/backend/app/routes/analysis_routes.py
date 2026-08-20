from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from app.database import get_db
from app.dependencies import get_current_user, verify_athlete_access

router = APIRouter(prefix="/api/analyses", tags=["Analysis Records"])

@router.get("")
async def get_analyses(
    athlete_id: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    db = get_db()
    analyses_coll = db.get_collection("analyses")

    user_role = current_user.get("role", "").lower()
    query = {}

    # Strict Data Isolation: Athlete role can only see their own analyses!
    if user_role == "athlete":
        my_athlete_id = current_user.get("athlete_id")
        if not my_athlete_id:
            athletes_coll = db.get_collection("athletes")
            my_ath = await athletes_coll.find_one({"user_id": current_user.get("id")})
            my_athlete_id = my_ath.get("id") if my_ath else None
        query["athlete_id"] = my_athlete_id
    elif athlete_id:
        query["athlete_id"] = athlete_id

    if risk_level and risk_level.lower() != "all":
        query["risk_level"] = {"$regex": risk_level, "$options": "i"}

    cursor = analyses_coll.find(query).sort("analysis_date", -1)
    results = await cursor.to_list(1000)

    if search:
        s = search.lower()
        results = [
            r for r in results
            if s in r.get("athlete_name", "").lower() or s in r.get("video_name", "").lower()
        ]

    # Format response
    formatted = []
    for r in results:
        formatted.append({
            "id": r.get("id") or r.get("_id"),
            "athlete_id": r.get("athlete_id"),
            "athlete_name": r.get("athlete_name", "Athlete"),
            "video_name": r.get("video_name", "Video"),
            "video_url": r.get("video_url", ""),
            "frames_analyzed": r.get("frames_analyzed", 120),
            "analysis_date": r.get("analysis_date", ""),
            "overall_risk_score": r.get("overall_risk_score", 0.0),
            "risk_level": r.get("risk_level", "Low"),
            "movement_quality_score": r.get("movement_quality_score", 80.0),
            "biomechanical_efficiency_score": r.get("biomechanical_efficiency_score", 80.0),
            "fatigue_risk_score": r.get("fatigue_risk_score", 20.0),
            "overall_health_score": r.get("overall_health_score", 85.0),
            "biomechanics": r.get("biomechanics", {}),
            "injury_predictions": r.get("injury_predictions", {}),
            "anomaly_detection": r.get("anomaly_detection", {}),
            "recommendations": r.get("recommendations", [])
        })
    return formatted


@router.get("/{analysis_id}")
async def get_analysis_by_id(
    analysis_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    db = get_db()
    analyses_coll = db.get_collection("analyses")

    analysis = await analyses_coll.find_one({"id": analysis_id})
    if not analysis:
        analysis = await analyses_coll.find_one({"_id": analysis_id})

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found.")

    # Strict ownership check for athlete role
    if current_user.get("role", "").lower() == "athlete":
        await verify_athlete_access(analysis.get("athlete_id"), current_user)

    analysis["id"] = analysis.get("id") or analysis.get("_id")
    return analysis


@router.delete("/{analysis_id}")
async def delete_analysis(
    analysis_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    db = get_db()
    analyses_coll = db.get_collection("analyses")
    await analyses_coll.delete_one({"id": analysis_id})
    return {"message": f"Analysis {analysis_id} deleted successfully."}
