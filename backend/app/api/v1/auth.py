from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import auth_service
from app.core.security import verify_password
from app.repositories.session import create_session, delete_session_by_token, get_session_by_token
from app.repositories.user import user_repo
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register(user_in: UserCreate, response: Response, db: AsyncSession = Depends(get_db)):
    user = await auth_service.register_user(db, user_in)
    # create server-side session and set HttpOnly cookie
    session = await create_session(db, user.id)
    response.set_cookie(key="session", value=session.token, httponly=True, samesite="lax")
    return user

@router.post("/login")
async def login(login_in: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    user = await user_repo.get_by_email(db, login_in.email)
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    # create session and set cookie
    session = await create_session(db, user.id)
    response.set_cookie(key="session", value=session.token, httponly=True, samesite="lax")
    user_out = UserResponse.from_orm(user)
    return {"user": user_out}


@router.post("/logout")
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    token = request.cookies.get("session")
    if token:
        await delete_session_by_token(db, token)
        response.delete_cookie("session")
    return {"detail": "Logged out"}


@router.get("/me", response_model=UserResponse)
async def me(request: Request, db: AsyncSession = Depends(get_db)):
    token = request.cookies.get("session")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    sess = await get_session_by_token(db, token)
    if not sess:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")
    user = await user_repo.get(db, sess.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return UserResponse.from_orm(user)
