from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from app.schemas import UserCreate, UserLogin, UserResponse, TokenResponse
from app.models import create_user_model, create_athlete_model, create_notification_model
from app.auth import get_password_hash, verify_password, create_access_token
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
async def register_user(user_in: UserCreate):
    db = get_db()
    users_coll = db.get_collection("users")

    # 1. Check if email exists
    existing_user = await users_coll.find_one({"email": user_in.email.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # 2. Validate password match if confirm provided
    if user_in.confirm_password and user_in.password != user_in.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password and Confirm Password do not match."
        )

    # 3. Hash password and save user
    hashed_pwd = get_password_hash(user_in.password)
    user_dict = create_user_model(
        full_name=user_in.full_name,
        email=user_in.email,
        hashed_password=hashed_pwd,
        role=user_in.role,
        phone_number=user_in.phone_number or ""
    )
    await users_coll.insert_one(user_dict)
    user_id = user_dict["id"]

    # 4. CRITICAL: If role is Athlete, automatically create linked Athlete Profile in DB!
    athlete_id = None
    if user_in.role.lower() == "athlete":
        athletes_coll = db.get_collection("athletes")
        athlete_dict = create_athlete_model(
            name=user_in.full_name,
            sport_type="General Athletics",
            position="Athlete",
            age=22,
            height=175.0,
            weight=70.0,
            injury_history="None reported",
            training_load="Moderate",
            user_id=user_id
        )
        await athletes_coll.insert_one(athlete_dict)
        athlete_id = athlete_dict["id"]
        
        # Create Welcome Notification
        notif_coll = db.get_collection("notifications")
        welcome_notif = create_notification_model(
            user_id=user_id,
            title="Welcome to Athletiq AI",
            message="Your account and athlete profile have been activated. Upload your first video to start AI injury risk analysis.",
            priority="Info"
        )
        await notif_coll.insert_one(welcome_notif)

    # 5. Generate JWT token
    access_token = create_access_token(data={"sub": user_id, "role": user_in.role.lower()})

    user_resp = UserResponse(
        id=user_id,
        full_name=user_dict["full_name"],
        email=user_dict["email"],
        role=user_dict["role"],
        phone_number=user_dict["phone_number"],
        is_active=user_dict["is_active"],
        created_at=user_dict["created_at"],
        athlete_id=athlete_id
    )

    return TokenResponse(access_token=access_token, token_type="bearer", user=user_resp)


@router.post("/login", response_model=TokenResponse)
async def login_user(user_in: UserLogin):
    db = get_db()
    users_coll = db.get_collection("users")

    user = await users_coll.find_one({"email": user_in.email.lower()})
    if not user or not verify_password(user_in.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact your system administrator."
        )

    user_id = user.get("id") or user.get("_id")
    user_role = user.get("role", "athlete").lower()

    athlete_id = None
    if user_role == "athlete":
        athletes_coll = db.get_collection("athletes")
        athlete = await athletes_coll.find_one({"user_id": user_id})
        if athlete:
            athlete_id = athlete.get("id") or athlete.get("_id")

    access_token = create_access_token(data={"sub": user_id, "role": user_role})

    user_resp = UserResponse(
        id=user_id,
        full_name=user.get("full_name", ""),
        email=user.get("email", ""),
        role=user_role,
        phone_number=user.get("phone_number", ""),
        is_active=user.get("is_active", True),
        created_at=user.get("created_at", ""),
        athlete_id=athlete_id
    )

    return TokenResponse(access_token=access_token, token_type="bearer", user=user_resp)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("_id")
    return UserResponse(
        id=user_id,
        full_name=current_user.get("full_name", ""),
        email=current_user.get("email", ""),
        role=current_user.get("role", ""),
        phone_number=current_user.get("phone_number", ""),
        is_active=current_user.get("is_active", True),
        created_at=current_user.get("created_at", ""),
        athlete_id=current_user.get("athlete_id")
    )
