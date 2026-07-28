from datetime import datetime, timedelta
from jose import jwt
import bcrypt
from dotenv import load_dotenv
from fastapi import Header, HTTPException
import os

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
TOKEN_EXPIRE_HOURS = int(os.getenv("TOKEN_EXPIRE_HOURS"))
def hash_password(password: str):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str):
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

def create_token(data: dict):
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str):
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

def get_current_user_and_role(authorization: str = Header(...)):
    """Same idea as get_current_user() in athelete_routes.py, but also
    returns the role from the token — used by staff_routes.py and
    admin_routes.py to check who's allowed to see what."""
    try:
        token = authorization.replace("Bearer ", "")
        payload = decode_token(token)
        return payload["user_id"], payload["role"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")