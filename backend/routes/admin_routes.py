from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
import os

router = APIRouter()

DATA_FILE = "data/users.json"


# ==========================
# Helpers
# ==========================

def load_users():
    if not os.path.exists(DATA_FILE):
        return []

    with open(DATA_FILE, "r") as file:
        return json.load(file)


def save_users(users):
    with open(DATA_FILE, "w") as file:
        json.dump(users, file, indent=4)


# ==========================
# Models
# ==========================

class RoleUpdate(BaseModel):
    role: str


# ==========================
# Get All Users
# ==========================

@router.get("/users")
def get_users():

    users = load_users()

    for user in users:
        user.pop("password", None)

    return users


# ==========================
# Delete User
# ==========================

@router.delete("/users/{email}")
def delete_user(email: str):

    users = load_users()

    filtered_users = [
        user
        for user in users
        if user["email"] != email
    ]

    if len(filtered_users) == len(users):
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    save_users(filtered_users)

    return {
        "message": "User deleted successfully."
    }


# ==========================
# Update User Role
# ==========================

@router.put("/users/{email}/role")
def update_role(
    email: str,
    data: RoleUpdate
):

    users = load_users()

    found = False

    for user in users:

        if user["email"] == email:

            user["role"] = data.role.lower()

            found = True

            break

    if not found:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    save_users(users)

    return {
        "message": "Role updated successfully."
    }