from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import datetime
import uuid
import logging
from jose import jwt, JWTError

from app import schemas, crud, auth, models
from app.database import get_db

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    user_rec = crud.create_user(db=db, user=user)
    
    logger.info("Verification token generated for a new account")
    
    return user_rec

@router.post("/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    # OAuth2 Form uses 'username' field for login email
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        logger.warning("Authentication failed for supplied account identifier")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Store user role and id in token payload
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role, "user_id": user.id}
    )
    refresh_token = auth.create_refresh_token(
        data={"sub": user.email, "role": user.role, "user_id": user.id}
    )
    
    # Update user session details
    user.refresh_token = refresh_token
    user.last_login = datetime.datetime.utcnow()
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token
    }

# We also implement a JSON login endpoint in case the React frontend prefers JSON payloads
@router.post("/login/json", response_model=schemas.Token)
def login_json(
    credentials: schemas.UserCreate, # reuse UserCreate or write custom
    db: Session = Depends(get_db)
):
    user = crud.get_user_by_email(db, email=credentials.email)
    if not user or not auth.verify_password(credentials.password, user.hashed_password):
        logger.warning("JSON authentication failed for supplied account identifier")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role, "user_id": user.id}
    )
    refresh_token = auth.create_refresh_token(
        data={"sub": user.email, "role": user.role, "user_id": user.id}
    )
    
    user.refresh_token = refresh_token
    user.last_login = datetime.datetime.utcnow()
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token
    }

@router.get("/me", response_model=schemas.UserResponse)
def get_current_user_profile(current_user: schemas.UserResponse = Depends(auth.get_current_user)):
    return current_user

@router.post("/verify")
def verify_email(payload: schemas.VerifyAccount, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=payload.email)
    if not user or user.verification_token != payload.token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or verification token"
        )
    user.is_verified = True
    user.verification_token = None
    db.commit()
    return {"status": "success", "message": "Email verified successfully"}

@router.post("/forgot-password")
def forgot_password(payload: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=payload.email)
    if not user:
        # Prevent user enumeration by failing silently
        return {"status": "success", "message": "If the account exists, a reset token has been generated."}
    
    reset_token = str(uuid.uuid4())
    user.reset_token = reset_token
    db.commit()
    
    logger.info("Password reset token generated for an existing account")
    
    return {
        "status": "success",
        "message": "If the account exists, reset instructions have been prepared."
    }

@router.post("/reset-password")
def reset_password(payload: schemas.ResetPasswordConfirm, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.reset_token == payload.token).first()
    if not user or not payload.token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    user.hashed_password = auth.get_password_hash(payload.new_password)
    user.reset_token = None
    db.commit()
    return {"status": "success", "message": "Password has been updated successfully"}

@router.post("/refresh", response_model=schemas.Token)
def refresh_token(payload: schemas.TokenRefreshRequest, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        decoded = jwt.decode(payload.refresh_token, auth.settings.JWT_SECRET_KEY, algorithms=[auth.settings.ALGORITHM])
        email: str = decoded.get("sub")
        is_refresh: bool = decoded.get("refresh", False)
        if email is None or not is_refresh:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or user.refresh_token != payload.refresh_token:
        raise credentials_exception
        
    # Generate new access token
    new_access = auth.create_access_token(
        data={"sub": user.email, "role": user.role, "user_id": user.id}
    )
    
    return {
        "access_token": new_access,
        "token_type": "bearer",
        "refresh_token": user.refresh_token # Return same refresh token
    }

@router.post("/logout")
def logout_user(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    current_user.refresh_token = None
    db.commit()
    return {"status": "success", "message": "Logged out successfully"}
