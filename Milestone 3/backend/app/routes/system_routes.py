from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Dict, Any, List
from app.database import get_db
from app.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/api/system", tags=["System & Admin"])

@router.get("/health")
async def health_check():
    db = get_db()
    return {
        "status": "healthy",
        "service": "Athletiq AI Backend",
        "version": "3.0.0",
        "database": "MongoDB" if db.use_mongo else "Embedded JSON Engine",
        "ai_engines": {
            "pose_estimation": "Active",
            "biomechanical_analysis": "Active",
            "anomaly_detection": "Active (IsolationForest)",
            "injury_prediction": "Active (RandomForest x6)",
            "risk_scoring": "Active (Weighted Model)",
            "recommendation_agent": "Active"
        }
    }


@router.get("/stats")
async def get_system_stats(current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_db()
    users_coll = db.get_collection("users")
    athletes_coll = db.get_collection("athletes")
    analyses_coll = db.get_collection("analyses")

    total_users = await users_coll.count_documents({})
    total_athletes = await athletes_coll.count_documents({})
    total_analyses = await analyses_coll.count_documents({})

    cursor_users = users_coll.find({})
    users = await cursor_users.to_list(1000)

    roles_dist = {
        "athlete": 0,
        "coach": 0,
        "physiotherapist": 0,
        "scientist": 0,
        "admin": 0
    }
    for u in users:
        r = u.get("role", "athlete").lower()
        if r in roles_dist:
            roles_dist[r] += 1
        else:
            roles_dist[r] = 1

    cursor_ath = athletes_coll.find({})
    athletes = await cursor_ath.to_list(1000)

    risk_dist = {"Low": 0, "Moderate": 0, "High": 0, "Critical": 0}
    for a in athletes:
        lvl = a.get("risk_level", "Low")
        if "low" in lvl.lower():
            risk_dist["Low"] += 1
        elif "mod" in lvl.lower():
            risk_dist["Moderate"] += 1
        elif "high" in lvl.lower():
            risk_dist["High"] += 1
        elif "crit" in lvl.lower():
            risk_dist["Critical"] += 1

    return {
        "total_users": total_users,
        "total_athletes": total_athletes,
        "total_analyses": total_analyses,
        "roles_distribution": roles_dist,
        "risk_distribution": risk_dist,
        "system_status": "Optimal",
        "api_uptime": "99.98%"
    }


@router.get("/users")
async def get_all_users(current_user: Dict[str, Any] = Depends(require_roles(["admin"]))):
    db = get_db()
    users_coll = db.get_collection("users")

    cursor = users_coll.find({}).sort("created_at", -1)
    users = await cursor.to_list(1000)

    result = []
    for u in users:
        result.append({
            "id": u.get("id") or u.get("_id"),
            "full_name": u.get("full_name", ""),
            "email": u.get("email", ""),
            "role": u.get("role", ""),
            "phone_number": u.get("phone_number", ""),
            "is_active": u.get("is_active", True),
            "created_at": u.get("created_at", "")
        })
    return result


@router.put("/users/{user_id}/status")
async def toggle_user_active_status(
    user_id: str,
    is_active: bool = Query(...),
    current_user: Dict[str, Any] = Depends(require_roles(["admin"]))
):
    db = get_db()
    users_coll = db.get_collection("users")

    await users_coll.update_one({"id": user_id}, {"$set": {"is_active": is_active}})
    return {"message": f"User status updated to {'active' if is_active else 'deactivated'}."}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: Dict[str, Any] = Depends(require_roles(["admin"]))
):
    db = get_db()
    users_coll = db.get_collection("users")
    await users_coll.delete_one({"id": user_id})
    return {"message": f"User {user_id} deleted."}
