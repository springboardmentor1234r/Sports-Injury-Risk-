from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.services.auth_service import get_current_user
from app.core.permissions import RoleChecker
from app.models.user import UserDoc, UserRole
from app.models.athlete import AthleteDoc, InjuryHistoryEntry, TrainingLoadEntry
from app.schemas.athlete import AthleteCreate, AthleteUpdate, InjuryCreate, TrainingLoadCreate
from app.services.athlete_service import AthleteService

router = APIRouter(prefix="/athletes", tags=["Athletes"])

# Staff checker helper
allow_staff = RoleChecker([UserRole.ADMIN, UserRole.COACH])

@router.get("/", response_model=List[AthleteDoc])
async def list_athletes(current_user: UserDoc = Depends(get_current_user)):
    if current_user.role == UserRole.ATHLETE:
        profile = await AthleteService.get_by_user_id(current_user.id)
        return [profile] if profile else []
    return await AthleteService.list_all_profiles()

@router.post("/", response_model=AthleteDoc, status_code=status.HTTP_201_CREATED)
async def create_athlete(data: AthleteCreate, current_user: UserDoc = Depends(allow_staff)):
    # Check if profile already exists for this user_id
    existing = await AthleteService.get_by_user_id(data.user_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Athlete profile already exists for this user ID"
        )
    return await AthleteService.create_profile(data)

@router.get("/{athlete_id}", response_model=AthleteDoc)
async def get_athlete(athlete_id: str, current_user: UserDoc = Depends(get_current_user)):
    profile = await AthleteService.get_by_id(athlete_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete profile not found"
        )
    return profile

@router.put("/{athlete_id}", response_model=AthleteDoc)
async def update_athlete(athlete_id: str, data: AthleteUpdate, current_user: UserDoc = Depends(get_current_user)):
    # Make sure profile exists
    profile = await AthleteService.get_by_id(athlete_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete profile not found"
        )
    # Check authorization (athletes can only update themselves, staff can update anyone)
    if current_user.role == UserRole.ATHLETE and profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to update this profile"
        )
    return await AthleteService.update_profile(athlete_id, data)

@router.get("/{athlete_id}/injuries", response_model=List[InjuryHistoryEntry])
async def get_athlete_injuries(athlete_id: str, current_user: UserDoc = Depends(get_current_user)):
    profile = await AthleteService.get_by_id(athlete_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete profile not found"
        )
    return profile.injury_history

@router.post("/{athlete_id}/injuries", status_code=status.HTTP_201_CREATED)
async def add_athlete_injury(athlete_id: str, injury: InjuryCreate, current_user: UserDoc = Depends(get_current_user)):
    profile = await AthleteService.get_by_id(athlete_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete profile not found"
        )
    entry = InjuryHistoryEntry(
        injury_type=injury.injury_type,
        body_part=injury.body_part,
        date_occurred=injury.date_occurred,
        severity=injury.severity,
        recovery_status=injury.recovery_status,
        notes=injury.notes
    )
    success = await AthleteService.add_injury(athlete_id, entry)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record injury history entry"
        )
    return entry

@router.post("/{athlete_id}/training-load", status_code=status.HTTP_201_CREATED)
async def add_athlete_training_load(athlete_id: str, load: TrainingLoadCreate, current_user: UserDoc = Depends(get_current_user)):
    profile = await AthleteService.get_by_id(athlete_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete profile not found"
        )
    entry = TrainingLoadEntry(
        date=load.date,
        load_score=load.load_score,
        session_type=load.session_type,
        duration_minutes=load.duration_minutes
    )
    success = await AthleteService.add_training_load(athlete_id, entry)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record training load entry"
        )
    return entry
