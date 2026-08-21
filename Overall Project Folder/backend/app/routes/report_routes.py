from fastapi import APIRouter, Depends, HTTPException, Response
from typing import List, Dict, Any
import json
from app.database import get_db
from app.dependencies import get_current_user, verify_athlete_access

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("")
async def get_reports(current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_db()
    reports_coll = db.get_collection("reports")

    user_role = current_user.get("role", "").lower()
    query = {}

    if user_role == "athlete":
        my_athlete_id = current_user.get("athlete_id")
        if not my_athlete_id:
            athletes_coll = db.get_collection("athletes")
            my_ath = await athletes_coll.find_one({"user_id": current_user.get("id")})
            my_athlete_id = my_ath.get("id") if my_ath else None
        query["athlete_id"] = my_athlete_id

    cursor = reports_coll.find(query).sort("generated_at", -1)
    reports = await cursor.to_list(500)

    for r in reports:
        r["id"] = r.get("id") or r.get("_id")
    return reports


@router.get("/{analysis_id}")
async def get_report_details(
    analysis_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    db = get_db()
    analyses_coll = db.get_collection("analyses")

    analysis = await analyses_coll.find_one({"id": analysis_id})
    if not analysis:
        analysis = await analyses_coll.find_one({"_id": analysis_id})

    if not analysis:
        raise HTTPException(status_code=404, detail="Report analysis data not found.")

    if current_user.get("role", "").lower() == "athlete":
        await verify_athlete_access(analysis.get("athlete_id"), current_user)

    analysis["id"] = analysis.get("id") or analysis.get("_id")
    return {
        "report_title": f"Athletiq AI - Biomechanical Injury Risk Report: {analysis.get('video_name')}",
        "athlete_name": analysis.get("athlete_name"),
        "analysis_date": analysis.get("analysis_date"),
        "overall_risk_score": analysis.get("overall_risk_score"),
        "risk_level": analysis.get("risk_level"),
        "movement_quality_score": analysis.get("movement_quality_score"),
        "biomechanical_efficiency_score": analysis.get("biomechanical_efficiency_score"),
        "injury_predictions": analysis.get("injury_predictions"),
        "biomechanics": analysis.get("biomechanics"),
        "anomaly_detection": analysis.get("anomaly_detection"),
        "recommendations": analysis.get("recommendations"),
        "report_footer": "Generated automatically by Athletiq AI Intelligence Engine v3.0"
    }
