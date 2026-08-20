import os
from datetime import datetime, timezone
import uuid
import shutil
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.database import get_db
from app.schemas.athlete import AthleteCreate, AthleteUpdate, AthleteOut, AthleteListResponse
from app.models.athlete import AthleteDB
from app.routers.auth import get_current_user

router = APIRouter(prefix="/athletes", tags=["Athletes"])
security = HTTPBearer()

UPLOAD_DIR = "static/photos"

@router.post("/upload-photo", status_code=status.HTTP_200_OK)
async def upload_photo(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload an athlete photo and get a relative URL. Requires token verification.
    """
    # Ensure upload directory exists
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File type rejected. Supported extensions: .jpg, .jpeg, .png, .webp, .gif"
        )
    
    # Save the file with a unique filename
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write file to local disk: {str(e)}"
        )
        
    return {"photo_url": f"/static/photos/{filename}"}

@router.post("", response_model=AthleteOut, status_code=status.HTTP_201_CREATED)
async def create_athlete(
    athlete_in: AthleteCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Create a new athlete profile. Automatically generates an Athlete ID if missing.
    """
    # Auto-generate human readable ID if not provided
    athlete_id = athlete_in.athlete_id
    if not athlete_id:
        count = await db["athletes"].count_documents({})
        athlete_id = f"ATH-{count + 1:03d}"
        
    # Check if duplicate Athlete ID exists
    existing = await db["athletes"].find_one({"athlete_id": athlete_id})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Athlete with ID {athlete_id} already exists."
        )

    athlete_doc = athlete_in.model_dump()
    athlete_doc["athlete_id"] = athlete_id
    athlete_doc["created_at"] = datetime.now(timezone.utc)
    athlete_doc["created_by"] = current_user["email"]

    result = await db["athletes"].insert_one(athlete_doc)
    athlete_doc["_id"] = str(result.inserted_id)

    return AthleteOut(**athlete_doc)

def is_coach_of_athlete(coach_user: dict, athlete_doc: dict) -> bool:
    if not athlete_doc:
        return False
    coach_id = str(coach_user.get("_id", ""))
    coach_email = coach_user.get("email", "").strip().lower()
    coach_name = coach_user.get("name", "").strip().lower()
    
    ath_coach_id = str(athlete_doc.get("coach_id") or "").strip().lower()
    ath_coach_name = (athlete_doc.get("coach_name") or "").strip().lower()
    ath_created_by = (athlete_doc.get("created_by") or "").strip().lower()
    
    return (
        (ath_coach_id and ath_coach_id in [coach_id.lower(), coach_email]) or
        (ath_coach_name and ath_coach_name in [coach_name, coach_email]) or
        (ath_created_by and ath_created_by == coach_email)
    )

@router.get("/coaches")
async def list_available_coaches(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Fetch all registered coaches from MongoDB for athlete assignment.
    """
    cursor = db["users"].find({"role": "Coach"})
    coaches = await cursor.to_list(length=100)
    return [
        {
            "id": str(c["_id"]),
            "name": c.get("name", "Coach"),
            "email": c.get("email")
        }
        for c in coaches
    ]

@router.get("", response_model=AthleteListResponse)
async def list_athletes(
    search: Optional[str] = None,
    sport: Optional[str] = None,
    gender: Optional[str] = None,
    page: int = 1,
    limit: int = 5,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Fetch a paginated list of athletes with search and filtering by sport and gender.
    Enforces Coach-Athlete data isolation: Coach sees only assigned athletes.
    """
    query = {}
    role = current_user.get("role")
    
    # Coach-Athlete Data Isolation: Coach sees only their assigned athletes
    if role == "Coach":
        coach_id = str(current_user.get("_id", ""))
        coach_name = current_user.get("name", "")
        coach_email = current_user.get("email", "")
        query["$or"] = [
            {"coach_id": coach_id},
            {"coach_id": coach_email},
            {"coach_name": {"$regex": f"^{coach_name}$", "$options": "i"}},
            {"coach_name": {"$regex": f"^{coach_email}$", "$options": "i"}},
            {"created_by": coach_email}
        ]
    
    # Implement text search on name or ID
    if search:
        search_filter = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"athlete_id": {"$regex": search, "$options": "i"}}
        ]
        if "$or" in query:
            query = {"$and": [{"$or": query["$or"]}, {"$or": search_filter}]}
        else:
            query["$or"] = search_filter
        
    # Filters
    if sport and sport != "All":
        query["sport"] = sport
    if gender and gender != "All":
        query["gender"] = gender

    # Calculate offset
    skip = (page - 1) * limit
    
    total = await db["athletes"].count_documents(query)
    
    cursor = db["athletes"].find(query).skip(skip).limit(limit)
    athletes_list = await cursor.to_list(length=limit)
    
    # Format bson ObjectId to string id
    formatted_athletes = []
    for doc in athletes_list:
        doc["_id"] = str(doc["_id"])
        formatted_athletes.append(AthleteOut(**doc))

    pages = (total + limit - 1) // limit if total > 0 else 1

    return AthleteListResponse(
        athletes=formatted_athletes,
        total=total,
        page=page,
        limit=limit,
        pages=pages
    )

@router.get("/my-profile", response_model=AthleteOut)
async def get_my_athlete_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Retrieve the athlete profile associated with the logged-in user's full name.
    """
    athlete_doc = await db["athletes"].find_one({
        "full_name": {"$regex": f"^{current_user['name']}$", "$options": "i"}
    })
    
    if not athlete_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No athlete profile associated with name: {current_user['name']}"
        )
        
    athlete_doc["_id"] = str(athlete_doc["_id"])
    return AthleteOut(**athlete_doc)

@router.get("/{id}", response_model=AthleteOut)
async def get_athlete(
    id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Retrieve details of a specific athlete by its MongoDB Hex ID.
    Enforces Coach-Athlete access boundaries.
    """
    if not ObjectId.is_valid(id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid database Hex ID format."
        )

    athlete_doc = await db["athletes"].find_one({"_id": ObjectId(id)})
    if not athlete_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete profile not found."
        )

    # Enforce Coach-Athlete isolation
    if current_user.get("role") == "Coach":
        if not is_coach_of_athlete(current_user, athlete_doc):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Athlete is not assigned to your coach profile."
            )
    elif current_user.get("role") == "Athlete":
        if athlete_doc.get("full_name", "").lower() != current_user.get("name", "").lower() and (athlete_doc.get("created_by") or "").lower() != current_user.get("email", "").lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only view your own profile."
            )

    athlete_doc["_id"] = str(athlete_doc["_id"])
    return AthleteOut(**athlete_doc)

@router.put("/{id}", response_model=AthleteOut)
async def update_athlete(
    id: str,
    athlete_in: AthleteUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Modify an existing athlete profile. Requires editor credentials.
    """
    if not ObjectId.is_valid(id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid database Hex ID format."
        )
        
    existing_doc = await db["athletes"].find_one({"_id": ObjectId(id)})
    if not existing_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete profile not found."
        )

    # Check permissions: Coach or Admin roles OR self-profile update
    if current_user["role"] not in ["Coach", "Admin"]:
        if existing_doc.get("full_name", "").lower() != current_user["name"].lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation rejected. Editor credentials or self-profile match required."
            )

    update_data = {k: v for k, v in athlete_in.model_dump().items() if v is not None}
    
    if update_data:
        await db["athletes"].update_one(
            {"_id": ObjectId(id)},
            {"$set": update_data}
        )
        
    updated_doc = await db["athletes"].find_one({"_id": ObjectId(id)})
    updated_doc["_id"] = str(updated_doc["_id"])
    return AthleteOut(**updated_doc)

@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_athlete(
    id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Permanently delete an athlete profile from MongoDB. Requires editor credentials.
    """
    if not ObjectId.is_valid(id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid database Hex ID format."
        )
        
    # Check permissions
    if current_user["role"] not in ["Coach", "Physiotherapist", "Sports Scientist", "Admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation rejected. Editor credentials required."
        )

    result = await db["athletes"].delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete profile not found."
        )

    return {"detail": "Athlete profile deleted successfully."}
