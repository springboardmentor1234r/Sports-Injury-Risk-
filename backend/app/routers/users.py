from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import auth, models, schemas
from ..database import get_db

router = APIRouter(prefix="/users", tags=["User Administration"])


@router.get("", response_model=list[schemas.UserOut])
def list_users(current_user: models.User = Depends(auth.require_roles(["administrator"])), db: Session = Depends(get_db)):
    return db.query(models.User).order_by(models.User.created_at.desc()).all()


@router.patch("/{user_id}/role", response_model=schemas.UserOut)
def change_role(user_id: int, update: schemas.UserRoleUpdate, current_user: models.User = Depends(auth.require_roles(["administrator"])), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = update.role
    if update.role == models.RoleEnum.athlete and not user.athlete_profile:
        db.add(models.AthleteProfile(user_id=user.id))
    db.commit()
    db.refresh(user)
    return user
