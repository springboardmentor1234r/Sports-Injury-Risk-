from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.schemas.user import UserCreate
from app.repositories.user import user_repo
from app.core.security import get_password_hash
from app.models.user import User

class AuthService:
    async def register_user(self, db: AsyncSession, user_in: UserCreate) -> User:
        user = await user_repo.get_by_email(db, email=user_in.email)
        if user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        user_data = user_in.model_dump()
        full_name = (user_in.resolved_full_name or user_in.email.split("@")[0]).strip()
        user_data["full_name"] = full_name
        user_data["hashed_password"] = get_password_hash(user_data.pop("password"))

        db_user = User(**user_data)
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user

auth_service = AuthService()
