"""
Internal Platform Operations Router
Prefix: /api/ops — not advertised in public documentation or user-facing code.
All endpoints require the internal admin role via the require_admin dependency.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, EmailStr
from api.dependencies import require_admin, get_current_user
from database.sql_utils import (
    get_all_users_paginated,
    update_user_roles,
    toggle_user_status,
    get_platform_analytics,
    get_session_audit_log,
    get_user_by_email,
    update_user_account,
)
import os
import psutil

router = APIRouter(prefix="/api/ops", tags=["ops"])


# ── User Management ───────────────────────────────────────────────────────────

@router.get("/users")
def list_all_users(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    _: Dict[str, Any] = Depends(require_admin)
):
    """Return paginated list of all registered accounts with their roles."""
    return get_all_users_paginated(page=page, size=size, search=search)


class RoleUpdateBody(BaseModel):
    roles: List[str]


@router.patch("/users/{user_id}/roles")
def patch_user_roles(
    user_id: int,
    body: RoleUpdateBody,
    _: Dict[str, Any] = Depends(require_admin)
):
    """Replace role set for a specific user."""
    allowed = {"athlete", "coach", "admin"}
    invalid = [r for r in body.roles if r not in allowed]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Invalid roles: {invalid}")
    ok = update_user_roles(user_id, body.roles)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to update roles")
    return {"message": "Roles updated successfully"}


class StatusUpdateBody(BaseModel):
    is_active: bool


@router.patch("/users/{user_id}/status")
def patch_user_status(
    user_id: int,
    body: StatusUpdateBody,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """Activate or deactivate a user account. Cannot deactivate your own account."""
    if str(user_id) == str(current_user["user_id"]):
        raise HTTPException(status_code=400, detail="Cannot change status of your own account")
    ok = toggle_user_status(user_id, body.is_active)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to update status")
    return {"message": f"Account {'activated' if body.is_active else 'deactivated'} successfully"}


# ── Platform Analytics ────────────────────────────────────────────────────────

@router.get("/analytics")
def platform_analytics(_: Dict[str, Any] = Depends(require_admin)):
    """Return high-level aggregated operational stats. No individual health data."""
    from database.redis_utils import get_redis_client
    import json
    
    redis_client = get_redis_client()
    cache_key = "ops:platform_analytics"
    
    # Try cache
    try:
        cached = redis_client.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass
        
    # Fetch fresh
    data = get_platform_analytics()
    if not data:
        raise HTTPException(status_code=503, detail="Analytics data unavailable")
        
    # Set cache (120 seconds)
    try:
        redis_client.setex(cache_key, 120, json.dumps(data))
    except Exception:
        pass
        
    return data


# ── System Diagnostics ────────────────────────────────────────────────────────

@router.get("/diagnostics")
def system_diagnostics(_: Dict[str, Any] = Depends(require_admin)):
    """Live health check across all platform subsystems."""
    results = {}

    # PostgreSQL / MySQL
    try:
        from database.sql_utils import get_connection, release_connection
        import time
        t0 = time.time()
        conn = get_connection()
        latency_ms = round((time.time() - t0) * 1000, 2)
        if conn:
            from database.postgres_utils import get_postgres_stats
            pg_stats = get_postgres_stats()
            results["sql_db"] = {"status": "ok", "latency_ms": latency_ms, **pg_stats}
            release_connection(conn)
        else:
            results["sql_db"] = {"status": "error", "message": "No connection returned"}
    except Exception as e:
        results["sql_db"] = {"status": "error", "message": str(e)}

    # MongoDB
    try:
        import time
        from database.mongo_utils import get_db_connection as get_mongo
        from database.mongo_utils import get_mongo_stats
        t0 = time.time()
        mongo_db = get_mongo()
        mongo_db.list_collection_names()
        latency_ms = round((time.time() - t0) * 1000, 2)
        m_stats = get_mongo_stats()
        results["mongodb"] = {"status": "ok", "latency_ms": latency_ms, **m_stats}
    except Exception as e:
        results["mongodb"] = {"status": "error", "message": str(e)}
        
    # Redis
    try:
        from database.redis_utils import get_redis_stats
        results["redis"] = get_redis_stats()
    except Exception as e:
        results["redis"] = {"status": "error", "message": str(e)}
        
    # Celery
    try:
        from src.worker.celery_app import celery_app
        # Use ping or just return basic celery info to avoid blocking if celery is down
        results["celery"] = {"status": "ok", "broker": "connected (see Redis stats)"}
        # To get deep inspect stats: celery_app.control.inspect().active() (can be slow, so we keep it light)
        i = celery_app.control.inspect(timeout=1.0)
        if i:
            active = i.active() or {}
            reserved = i.reserved() or {}
            scheduled = i.scheduled() or {}
            results["celery"]["active_jobs"] = sum(len(v) for v in active.values())
            results["celery"]["reserved_jobs"] = sum(len(v) for v in reserved.values())
            results["celery"]["scheduled_jobs"] = sum(len(v) for v in scheduled.values())
        else:
            results["celery"]["message"] = "Workers not responding or offline"
    except Exception as e:
        results["celery"] = {"status": "error", "message": str(e)}

    # Cloudinary
    try:
        import cloudinary
        import os
        cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME", "")
        api_key = os.getenv("CLOUDINARY_API_KEY", "")
        results["cloudinary"] = {
            "status": "ok" if cloud_name and api_key else "warning",
            "cloud_name": cloud_name if cloud_name else "not configured"
        }
    except Exception as e:
        results["cloudinary"] = {"status": "error", "message": str(e)}

    # AI Pipeline (MediaPipe / OpenCV)
    try:
        import cv2
        import mediapipe  # noqa
        results["ai_pipeline"] = {"status": "ok", "opencv_version": cv2.__version__}
    except Exception as e:
        results["ai_pipeline"] = {"status": "error", "message": str(e)}

    # Server Resources
    try:
        import psutil
        import time
        cpu = psutil.cpu_percent(interval=0.2)
        mem = psutil.virtual_memory()
        disk = psutil.disk_usage("/")
        net = psutil.net_io_counters()
        uptime_seconds = time.time() - psutil.boot_time()
        
        try:
            load_avg = psutil.getloadavg()
        except Exception:
            load_avg = (0.0, 0.0, 0.0) # getloadavg might fail on Windows
            
        results["server"] = {
            "status": "ok",
            "uptime_days": round(uptime_seconds / (24 * 3600), 2),
            "cpu_percent": cpu,
            "load_average": load_avg,
            "ram_used_gb": round(mem.used / (1024 ** 3), 2),
            "ram_total_gb": round(mem.total / (1024 ** 3), 2),
            "ram_percent": mem.percent,
            "disk_used_gb": round(disk.used / (1024 ** 3), 2),
            "disk_total_gb": round(disk.total / (1024 ** 3), 2),
            "disk_percent": disk.percent,
            "net_sent_mb": round(net.bytes_sent / (1024 * 1024), 2),
            "net_recv_mb": round(net.bytes_recv / (1024 * 1024), 2)
        }
    except Exception as e:
        results["server"] = {"status": "error", "message": str(e)}

    return results


# ── Session Audit ─────────────────────────────────────────────────────────────

@router.get("/sessions/audit")
def session_audit_log(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status_filter: str = Query(""),
    _: Dict[str, Any] = Depends(require_admin)
):
    """Return a global operational log of all sessions. No biomechanical health data exposed."""
    return get_session_audit_log(page=page, size=size, status_filter=status_filter)


# ── My Account (for the ops user) ────────────────────────────────────────────

class EmailUpdateBody(BaseModel):
    new_email: EmailStr
    otp: str


@router.put("/me/email")
def update_ops_email(
    body: EmailUpdateBody,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """Update the ops account email after OTP verification."""
    from database.redis_utils import verify_otp

    # Verify OTP against the current email address
    if not verify_otp(current_user["email"], body.otp, prefix="reset_otp"):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    existing = get_user_by_email(body.new_email)
    if existing and str(existing["id"]) != str(current_user["user_id"]):
        raise HTTPException(status_code=400, detail="Email already registered to another account")

    # Get current full_name from DB
    from database.sql_utils import get_user_by_id
    db_user = get_user_by_id(int(current_user["user_id"]))
    full_name = db_user["full_name"] if db_user else "Platform Administrator"

    ok = update_user_account(int(current_user["user_id"]), full_name, body.new_email)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to update email")
    return {"message": "Email updated successfully", "new_email": body.new_email}
