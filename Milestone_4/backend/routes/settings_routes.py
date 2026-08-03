"""
Account Settings — update profile (name/email/bio), change password,
upload a profile picture. Available to every logged-in user regardless
of role (athlete, coach, physiotherapist, sports_scientist, admin).
Location: backend/routes/settings_routes.py
"""

import os
import shutil
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import UserOut, UpdateProfileRequest, ChangePasswordRequest
from auth import hash_password, verify_password
from routes.athelete_routes import get_current_user

router = APIRouter(prefix="/users", tags=["Account Settings"])

PROFILE_PICTURE_DIR = "uploads/profile_pictures"
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_IMAGE_SIZE_MB = 5

os.makedirs(PROFILE_PICTURE_DIR, exist_ok=True)


def _get_user_or_404(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/me", response_model=UserOut)
def get_my_profile(db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    return _get_user_or_404(db, user_id)


@router.put("/me", response_model=UserOut)
def update_my_profile(
    data: UpdateProfileRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    user = _get_user_or_404(db, user_id)

    if data.email is not None and data.email != user.email:
        existing = db.query(User).filter(User.email == data.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="That email is already in use")
        user.email = data.email

    if data.name is not None:
        user.name = data.name
    if data.bio is not None:
        user.bio = data.bio

    db.commit()
    db.refresh(user)
    return user


@router.post("/me/password")
def change_my_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    user = _get_user_or_404(db, user_id)

    if not verify_password(data.current_password, user.password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    user.password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}


@router.post("/me/profile-picture", response_model=UserOut)
async def upload_profile_picture(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    user = _get_user_or_404(db, user_id)

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image type '{ext}'. Allowed: {sorted(ALLOWED_IMAGE_EXTENSIONS)}",
        )

    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(PROFILE_PICTURE_DIR, unique_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    size_mb = os.path.getsize(file_path) / (1024 * 1024)
    if size_mb > MAX_IMAGE_SIZE_MB:
        os.remove(file_path)
        raise HTTPException(
            status_code=400,
            detail=f"Image too large ({size_mb:.1f}MB). Max allowed is {MAX_IMAGE_SIZE_MB}MB.",
        )

    # Remove the old profile picture from disk, if any, so uploads don't
    # accumulate every time someone changes their photo.
    if user.profile_picture:
        old_path = user.profile_picture.replace("/uploads/", "uploads/", 1)
        if os.path.isfile(old_path):
            try:
                os.remove(old_path)
            except OSError:
                pass  # non-critical — an orphaned old file isn't worth failing the request over

    # Stored as a URL path so the frontend can use it directly as an <img src>,
    # served by the existing app.mount("/uploads", ...) in main.py.
    user.profile_picture = f"/uploads/profile_pictures/{unique_name}"
    db.commit()
    db.refresh(user)
    return user
