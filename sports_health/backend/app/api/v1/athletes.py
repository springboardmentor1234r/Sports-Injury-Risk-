# Athlete endpoints placeholder
from fastapi import APIRouter, Depends, HTTPException
from app.models.user import User, AthleteProfile, UserRole
from app.schemas.athlete import AthleteProfileCreate, AthleteProfileOut, AthleteProfileUpdate
from app.api.deps import get_current_user, check_role

router = APIRouter()

@router.post("/me/profile", response_model=AthleteProfileOut)
async def create_my_profile(
    profile_in: AthleteProfileCreate, 
    current_user: User = Depends(get_current_user)
):
    # Check if profile already exists
    existing_profile = await AthleteProfile.find_one({"user_id": str(current_user.id)})
    if existing_profile:
        raise HTTPException(status_code=400, detail="Profile already exists. Use PUT to update.")
    
    new_profile = AthleteProfile(
        **profile_in.dict(),
        user_id=str(current_user.id)
    )
    await new_profile.insert()
    return new_profile

@router.get("/me/profile", response_model=AthleteProfileOut)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    profile = await AthleteProfile.find_one({"user_id": str(current_user.id)})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.put("/me/profile", response_model=AthleteProfileOut)
async def update_my_profile(
    profile_update: AthleteProfileUpdate,
    current_user: User = Depends(get_current_user)
):
    profile = await AthleteProfile.find_one(AthleteProfile.user_id == str(current_user.id))
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    update_data = profile_update.dict(exclude_unset=True)
    await profile.set(update_data)
    return profile

# COACH ACCESS: Get any athlete's profile by their User ID
@router.get("/{user_id}/profile", response_model=AthleteProfileOut)
async def get_athlete_profile_by_id(
    user_id: str,
    current_user: User = Depends(check_role(UserRole.COACH))
):
    profile = await AthleteProfile.find_one(AthleteProfile.user_id == user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Athlete profile not found")
    return profile