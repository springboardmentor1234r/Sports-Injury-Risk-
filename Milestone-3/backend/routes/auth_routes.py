from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
import json
import os

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DATA_FILE = "data/users.json"


class RegisterUser(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginUser(BaseModel):
    email: EmailStr
    password: str


def load_users():
    if not os.path.exists(DATA_FILE):
        return []

    with open(DATA_FILE, "r") as file:
        return json.load(file)


def save_users(users):
    with open(DATA_FILE, "w") as file:
        json.dump(users, file, indent=4)


@router.post("/register")
def register(user: RegisterUser):

    users = load_users()

    for existing_user in users:
        if existing_user["email"] == user.email:
            raise HTTPException(
                status_code=400,
                detail="Email already registered."
            )

    hashed_password = pwd_context.hash(user.password)

    users.append({
        "name": user.name,
        "email": user.email,
        "password": hashed_password
    })

    save_users(users)

    return {
        "message": "Registration Successful"
    }


@router.post("/login")
def login(user: LoginUser):

    users = load_users()

    for existing_user in users:

        if existing_user["email"] == user.email:

            if pwd_context.verify(
                user.password,
                existing_user["password"]
            ):
                return {
                    "message": "Login Successful",
                    "name": existing_user["name"]
                }

            raise HTTPException(
                status_code=401,
                detail="Incorrect password."
            )

    raise HTTPException(
        status_code=404,
        detail="User not found."
    )