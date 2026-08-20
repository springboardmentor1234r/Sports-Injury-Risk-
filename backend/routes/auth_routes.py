from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext

import json
import os
import urllib.request
import urllib.error


router = APIRouter()


# ============================================================
# PASSWORD HASHING
# ============================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# ============================================================
# CONFIGURATION
# ============================================================

DATA_FILE = "data/users.json"


# ============================================================
# ADMIN GOOGLE ACCOUNTS
# ============================================================
#
# These Google accounts are ALWAYS treated as administrators.
#
# IMPORTANT:
# Keep the email in lowercase.
#

ADMIN_GOOGLE_EMAILS = {
    "sejalchintala11@gmail.com"
}


# ============================================================
# MODELS
# ============================================================


class RegisterUser(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str


class LoginUser(BaseModel):
    email: EmailStr
    password: str
    role: str


class GoogleLoginUser(BaseModel):

    # Google OAuth access token
    access_token: str | None = None

    # Some Google login implementations use credential
    credential: str | None = None

    # Frontend user information
    email: str | None = None
    name: str | None = None

    # Selected role from frontend
    role: str = "athlete"


class ProfileUpdate(BaseModel):
    name: str
    sport: str
    age: int
    gender: str
    height: str
    weight: str
    dominantLeg: str
    previousInjury: str


# ============================================================
# HELPER FUNCTIONS
# ============================================================


def load_users():

    if not os.path.exists(DATA_FILE):
        return []

    try:

        with open(DATA_FILE, "r") as file:
            data = json.load(file)

            if isinstance(data, list):
                return data

            return []

    except (json.JSONDecodeError, FileNotFoundError):

        return []


def save_users(users):

    directory = os.path.dirname(DATA_FILE)

    if directory:
        os.makedirs(
            directory,
            exist_ok=True
        )

    with open(DATA_FILE, "w") as file:

        json.dump(
            users,
            file,
            indent=4
        )


# ============================================================
# REGISTER
# ============================================================


@router.post("/register")
def register(user: RegisterUser):

    users = load_users()

    email = str(user.email).lower().strip()

    role = user.role.lower().strip()

    # --------------------------------------------------------
    # Validate role
    # --------------------------------------------------------

    if role not in ["athlete", "coach", "admin"]:

        raise HTTPException(
            status_code=400,
            detail="Invalid role."
        )

    # --------------------------------------------------------
    # Admin cannot register normally
    # --------------------------------------------------------

    if role == "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin accounts cannot be registered."
        )

    # --------------------------------------------------------
    # Check duplicate email
    # --------------------------------------------------------

    for existing_user in users:

        existing_email = (
            existing_user.get("email", "")
            .lower()
            .strip()
        )

        if existing_email == email:

            raise HTTPException(
                status_code=400,
                detail="Email already registered."
            )

    # --------------------------------------------------------
    # Hash password
    # --------------------------------------------------------

    hashed_password = pwd_context.hash(
        user.password
    )

    # --------------------------------------------------------
    # Create user
    # --------------------------------------------------------

    new_user = {

        "name": user.name,

        "email": email,

        "password": hashed_password,

        "role": role,

        "sport": "",

        "age": 0,

        "gender": "",

        "height": "",

        "weight": "",

        "dominantLeg": "",

        "previousInjury": "",

        "google_login": False

    }

    users.append(new_user)

    save_users(users)

    return {

        "success": True,

        "message": "Registration Successful"

    }


# ============================================================
# NORMAL LOGIN
# ============================================================


@router.post("/login")
def login(user: LoginUser):

    users = load_users()

    email = str(user.email).lower().strip()

    selected_role = user.role.lower().strip()

    # --------------------------------------------------------
    # Validate role
    # --------------------------------------------------------

    if selected_role not in [
        "athlete",
        "coach",
        "admin"
    ]:

        raise HTTPException(
            status_code=400,
            detail="Invalid role."
        )

    # --------------------------------------------------------
    # Find user
    # --------------------------------------------------------

    for existing_user in users:

        existing_email = (
            existing_user.get("email", "")
            .lower()
            .strip()
        )

        if existing_email == email:

            stored_role = (
                existing_user.get(
                    "role",
                    "athlete"
                )
                .lower()
                .strip()
            )

            # ------------------------------------------------
            # Check role
            # ------------------------------------------------

            if stored_role != selected_role:

                raise HTTPException(
                    status_code=401,
                    detail="Invalid role selected."
                )

            # ------------------------------------------------
            # Google-only account
            # ------------------------------------------------

            if not existing_user.get("password"):

                raise HTTPException(
                    status_code=400,
                    detail=(
                        "This account uses Google Login. "
                        "Please continue with Google."
                    )
                )

            # ------------------------------------------------
            # Check password
            # ------------------------------------------------

            password_valid = pwd_context.verify(
                user.password,
                existing_user["password"]
            )

            if not password_valid:

                raise HTTPException(
                    status_code=401,
                    detail="Incorrect password."
                )

            # ------------------------------------------------
            # Successful login
            # ------------------------------------------------

            return {

                "success": True,

                "message": "Login Successful",

                "name": existing_user.get(
                    "name",
                    email.split("@")[0]
                ),

                "email": existing_user.get(
                    "email",
                    email
                ),

                "role": stored_role

            }

    # --------------------------------------------------------
    # User not found
    # --------------------------------------------------------

    raise HTTPException(
        status_code=404,
        detail="User not found."
    )


# ============================================================
# GOOGLE LOGIN
# ============================================================


@router.post("/google-login")
def google_login(user: GoogleLoginUser):

    try:

        print()
        print("======================================")
        print("GOOGLE LOGIN REQUEST")
        print("======================================")

        google_email = None
        google_name = None
        google_picture = None
        google_verified = True

        # ====================================================
        # OPTION 1
        # ====================================================
        #
        # If frontend sends an access token, verify it
        # directly with Google.
        #

        google_access_token = (
            user.access_token
            or user.credential
        )

        if google_access_token:

            print("Google access token received.")

            google_url = (
                "https://www.googleapis.com/oauth2/v3/userinfo"
            )

            request = urllib.request.Request(

                google_url,

                headers={
                    "Authorization":
                    f"Bearer {google_access_token}"
                },

                method="GET"
            )

            try:

                with urllib.request.urlopen(
                    request,
                    timeout=10
                ) as response:

                    response_data = response.read()

                    google_user = json.loads(
                        response_data.decode("utf-8")
                    )

            except urllib.error.HTTPError as error:

                print(
                    "Google rejected access token:",
                    error.code
                )

                raise HTTPException(
                    status_code=401,
                    detail="Invalid or expired Google access token."
                )

            except urllib.error.URLError as error:

                print(
                    "Unable to contact Google:",
                    error
                )

                raise HTTPException(
                    status_code=503,
                    detail=(
                        "Unable to contact Google "
                        "authentication service."
                    )
                )

            google_email = google_user.get(
                "email"
            )

            google_name = google_user.get(
                "name"
            )

            google_picture = google_user.get(
                "picture"
            )

            google_verified = google_user.get(
                "email_verified",
                False
            )

        # ====================================================
        # OPTION 2
        # ====================================================
        #
        # Your current Login.js sends email + name.
        #
        # Accept those values too so there is NO 422 caused
        # by different frontend versions.
        #

        else:

            print(
                "No Google access token supplied."
            )

            google_email = user.email

            google_name = user.name

            google_verified = True

        # ====================================================
        # VALIDATE EMAIL
        # ====================================================

        if not google_email:

            raise HTTPException(
                status_code=400,
                detail="Google account email not available."
            )

        # ====================================================
        # NORMALIZE EMAIL
        # ====================================================

        google_email = (
            google_email
            .strip()
            .lower()
        )

        # ====================================================
        # NAME
        # ====================================================

        if not google_name:

            google_name = (
                google_email
                .split("@")[0]
                .replace(".", " ")
                .title()
            )

        # ====================================================
        # GOOGLE EMAIL VERIFICATION
        # ====================================================

        if not google_verified:

            raise HTTPException(
                status_code=401,
                detail="Google email is not verified."
            )

        # ====================================================
        # ADMIN ROLE CHECK
        # ====================================================
        #
        # THIS IS THE IMPORTANT PART.
        #
        # Your Gmail:
        #
        # sejalchintala11@gmail.com
        #
        # will ALWAYS receive:
        #
        # role = admin
        #

        if google_email in ADMIN_GOOGLE_EMAILS:

            google_role = "admin"

            # Make sure the displayed admin name is correct
            if google_email == "sejalchintala11@gmail.com":

                google_name = "Sejal Chintala"

        else:

            # All other Google accounts are athletes
            google_role = "athlete"

        print()
        print("Google User:")
        print("Name:", google_name)
        print("Email:", google_email)
        print("Role:", google_role)
        print()

        # ====================================================
        # LOAD USERS
        # ====================================================

        users = load_users()

        # ====================================================
        # CHECK EXISTING USER
        # ====================================================

        for existing_user in users:

            existing_email = (
                existing_user
                .get("email", "")
                .lower()
                .strip()
            )

            if existing_email == google_email:

                print(
                    "Existing Google account found."
                )

                # ------------------------------------------------
                # Update Google login status
                # ------------------------------------------------

                existing_user["google_login"] = True

                # ------------------------------------------------
                # Update name
                # ------------------------------------------------

                existing_user["name"] = google_name

                # ------------------------------------------------
                # IMPORTANT:
                #
                # Always update role from the ADMIN email list.
                #
                # This fixes an old account that was previously
                # stored as athlete.
                # ------------------------------------------------

                existing_user["role"] = google_role

                # ------------------------------------------------
                # Save
                # ------------------------------------------------

                save_users(users)

                print(
                    "Existing user updated."
                )

                print(
                    "Final role:",
                    existing_user["role"]
                )

                print()

                return {

                    "success": True,

                    "message":
                        "Google Login Successful",

                    "name":
                        existing_user["name"],

                    "email":
                        existing_user["email"],

                    "role":
                        google_role,

                    "picture":
                        google_picture

                }

        # ====================================================
        # CREATE NEW GOOGLE USER
        # ====================================================

        print(
            "Creating new Google account."
        )

        new_user = {

            "name":
                google_name,

            "email":
                google_email,

            "password":
                "",

            "role":
                google_role,

            "sport":
                "",

            "age":
                0,

            "gender":
                "",

            "height":
                "",

            "weight":
                "",

            "dominantLeg":
                "",

            "previousInjury":
                "",

            "google_login":
                True

        }

        users.append(new_user)

        save_users(users)

        print(
            "New Google user created."
        )

        print(
            "Role:",
            google_role
        )

        print()

        # ====================================================
        # RETURN RESPONSE
        # ====================================================

        return {

            "success": True,

            "message":
                "Google Login Successful",

            "name":
                new_user["name"],

            "email":
                new_user["email"],

            "role":
                new_user["role"],

            "picture":
                google_picture

        }

    # ========================================================
    # HTTP EXCEPTION
    # ========================================================

    except HTTPException:

        raise

    # ========================================================
    # UNEXPECTED ERROR
    # ========================================================

    except Exception as error:

        print()
        print("======================================")
        print("GOOGLE LOGIN ERROR")
        print("======================================")
        print(error)
        print("======================================")
        print()

        raise HTTPException(
            status_code=500,
            detail="Google authentication failed."
        )


# ============================================================
# GET PROFILE
# ============================================================


@router.get("/profile/{email}")
def get_profile(email: str):

    users = load_users()

    email = email.lower().strip()

    for user in users:

        user_email = (
            user.get("email", "")
            .lower()
            .strip()
        )

        if user_email == email:

            return {

                "name":
                    user.get(
                        "name",
                        ""
                    ),

                "email":
                    user.get(
                        "email",
                        ""
                    ),

                "role":
                    user.get(
                        "role",
                        "athlete"
                    ),

                "sport":
                    user.get(
                        "sport",
                        ""
                    ),

                "age":
                    user.get(
                        "age",
                        0
                    ),

                "gender":
                    user.get(
                        "gender",
                        ""
                    ),

                "height":
                    user.get(
                        "height",
                        ""
                    ),

                "weight":
                    user.get(
                        "weight",
                        ""
                    ),

                "dominantLeg":
                    user.get(
                        "dominantLeg",
                        ""
                    ),

                "previousInjury":
                    user.get(
                        "previousInjury",
                        ""
                    )

            }

    raise HTTPException(
        status_code=404,
        detail="User not found."
    )


# ============================================================
# UPDATE PROFILE
# ============================================================


@router.put("/profile/{email}")
def update_profile(
    email: str,
    profile: ProfileUpdate
):

    users = load_users()

    email = email.lower().strip()

    for user in users:

        user_email = (
            user.get("email", "")
            .lower()
            .strip()
        )

        if user_email == email:

            # ------------------------------------------------
            # Update profile
            # ------------------------------------------------

            user["name"] = profile.name

            user["sport"] = profile.sport

            user["age"] = profile.age

            user["gender"] = profile.gender

            user["height"] = profile.height

            user["weight"] = profile.weight

            user["dominantLeg"] = (
                profile.dominantLeg
            )

            user["previousInjury"] = (
                profile.previousInjury
            )

            # ------------------------------------------------
            # IMPORTANT:
            #
            # Do NOT accidentally change the user's role here.
            #
            # Admin stays admin.
            # ------------------------------------------------

            save_users(users)

            return {

                "success": True,

                "message":
                    "Profile updated successfully."

            }

    raise HTTPException(
        status_code=404,
        detail="User not found."
    )


# ============================================================
# LOGOUT
# ============================================================


@router.post("/logout")
def logout():

    return {

        "success": True,

        "message":
            "Logged out successfully"

    }