from fastapi import HTTPException, status
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

async def verify_session_permission(
    session_id: str,
    current_user: dict,
    db: AsyncIOMotorDatabase
) -> dict:
    """
    Validates if the authenticated user has rights to view or alter a session's reports.
    Admins can access all sessions.
    Coaches can only access sessions of athletes assigned to them.
    Athletes are restricted to their own session files.
    """
    try:
        session_doc = await db["AnalysisSessions"].find_one({"_id": ObjectId(session_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Session ID format."
        )

    if not session_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis session not found."
        )

    role = current_user.get("role")
    if role == "Admin":
        return session_doc

    current_email = current_user.get("email", "").strip().lower()
    session_created_by = (session_doc.get("created_by") or "").strip().lower()

    athlete_id = session_doc.get("athlete_id")
    athlete_doc = None
    try:
        athlete_doc = await db["athletes"].find_one({"_id": ObjectId(athlete_id)})
    except Exception:
        pass
    if not athlete_doc:
        athlete_doc = await db["athletes"].find_one({"athlete_id": athlete_id})

    if role == "Coach":
        coach_id = str(current_user.get("_id", ""))
        coach_email = current_user.get("email", "").strip().lower()
        coach_name = current_user.get("name", "").strip().lower()

        is_owner = (session_created_by and session_created_by == coach_email)
        if athlete_doc:
            ath_coach_id = str(athlete_doc.get("coach_id") or "").strip().lower()
            ath_coach_name = (athlete_doc.get("coach_name") or "").strip().lower()
            ath_created_by = (athlete_doc.get("created_by") or "").strip().lower()
            if (
                (ath_coach_id and ath_coach_id in [coach_id.lower(), coach_email]) or
                (ath_coach_name and ath_coach_name in [coach_name, coach_email]) or
                (ath_created_by and ath_created_by == coach_email)
            ):
                is_owner = True

        if not is_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You are not authorized to view another coach's session data."
            )
        return session_doc

    # Athlete Role
    if current_email and session_created_by and current_email == session_created_by:
        return session_doc

    if not athlete_doc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Session's athlete profile could not be verified."
        )

    if (
        athlete_doc.get("full_name", "").strip().lower() != current_user.get("name", "").strip().lower() and
        (athlete_doc.get("created_by") or "").strip().lower() != current_email
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this athlete's session data."
        )

    return session_doc


async def verify_athlete_permission(
    athlete_id: str,
    current_user: dict,
    db: AsyncIOMotorDatabase
) -> dict:
    """
    Validates if the authenticated user has rights to view or list an athlete's history or notifications list.
    """
    role = current_user.get("role")
    if role == "Admin":
        return {}

    athlete_doc = None
    try:
        athlete_doc = await db["athletes"].find_one({"_id": ObjectId(athlete_id)})
    except Exception:
        pass
    if not athlete_doc:
        athlete_doc = await db["athletes"].find_one({"athlete_id": athlete_id})

    if not athlete_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete profile not found."
        )

    current_email = current_user.get("email", "").strip().lower()

    if role == "Coach":
        coach_id = str(current_user.get("_id", ""))
        coach_email = current_user.get("email", "").strip().lower()
        coach_name = current_user.get("name", "").strip().lower()
        ath_coach_id = str(athlete_doc.get("coach_id") or "").strip().lower()
        ath_coach_name = (athlete_doc.get("coach_name") or "").strip().lower()
        ath_created_by = (athlete_doc.get("created_by") or "").strip().lower()
        if not (
            (ath_coach_id and ath_coach_id in [coach_id.lower(), coach_email]) or
            (ath_coach_name and ath_coach_name in [coach_name, coach_email]) or
            (ath_created_by and ath_created_by == coach_email)
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Athlete is not assigned to your coach profile."
            )
        return athlete_doc

    if role == "Athlete":
        if (
            athlete_doc.get("full_name", "").strip().lower() != current_user.get("name", "").strip().lower() and
            (athlete_doc.get("created_by") or "").strip().lower() != current_email
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to access another athlete's data."
            )
        return athlete_doc

    return athlete_doc
