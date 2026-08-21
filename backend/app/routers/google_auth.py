import os

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from authlib.integrations.base_client import OAuthError

from app.database.connection import get_db
from app.models.user import User
from app.utils.google_oauth import oauth
from app.utils.jwt_handler import create_access_token
from app.utils.roles import validate_role


router = APIRouter(
    prefix="/auth/google",
    tags=["Google Authentication"],
)


REGISTRATION_ROLES = {
    "athlete",
    "coach",
    "physiotherapist",
    "sports_scientist",
}


def get_frontend_url() -> str:
    return os.getenv(
        "FRONTEND_URL",
        "http://localhost:5173",
    ).rstrip("/")


def get_redirect_uri() -> str:
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")

    if not redirect_uri:
        raise HTTPException(
            status_code=500,
            detail="GOOGLE_REDIRECT_URI is not configured.",
        )

    return redirect_uri.strip()


@router.get("/login")
async def google_login(
    request: Request,
    role: str | None = None,
):
    is_registration = role is not None

    if is_registration:
        try:
            role = validate_role(role)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid role.",
            )

        if role not in REGISTRATION_ROLES:
            raise HTTPException(
                status_code=400,
                detail="This role cannot register with Google.",
            )

        request.session["google_role"] = role
        request.session["google_action"] = "register"

    else:
        request.session.pop("google_role", None)
        request.session["google_action"] = "login"

    redirect_uri = get_redirect_uri()

    print("\n========== GOOGLE LOGIN ==========")
    print("Action:", request.session.get("google_action"))
    print("Role:", request.session.get("google_role"))
    print("Redirect URI:", redirect_uri)
    print("==================================\n")

    return await oauth.google.authorize_redirect(
        request,
        redirect_uri,
    )


@router.get("/callback")
async def google_callback(
    request: Request,
):
    print("\n========== GOOGLE CALLBACK ==========")
    print("URL:", request.url)
    print("Session:", dict(request.session))

    try:
        token = await oauth.google.authorize_access_token(request)

        user_info = token.get("userinfo")

        if not user_info:
            user_info = await oauth.google.userinfo(
                token=token
            )

        if not user_info:
            raise HTTPException(
                status_code=400,
                detail="Google user information missing.",
            )

        google_email = (
            user_info.get("email") or ""
        ).strip().lower()

        google_id = user_info.get("sub")

        email_verified = user_info.get(
            "email_verified",
            False,
        )

        if not google_email:
            raise HTTPException(
                status_code=400,
                detail="Google account email missing.",
            )

        if not google_id:
            raise HTTPException(
                status_code=400,
                detail="Google account ID missing.",
            )

        if not email_verified:
            raise HTTPException(
                status_code=403,
                detail="Google email is not verified.",
            )

        action = request.session.pop(
            "google_action",
            "login",
        )

        registration_role = request.session.pop(
            "google_role",
            None,
        )

        print("Google email:", google_email)
        print("Google ID:", google_id)
        print("Action:", action)
        print("Registration role:", registration_role)

        db: Session = next(get_db())

        try:
            existing_user = (
                db.query(User)
                .filter(
                    User.email == google_email
                )
                .first()
            )

            if action == "register":

                if existing_user:
                    print(
                        "GOOGLE REGISTRATION BLOCKED: "
                        "ACCOUNT ALREADY EXISTS"
                    )

                    return RedirectResponse(
                        url=(
                            f"{get_frontend_url()}"
                            "/register"
                            "?google_error=already_registered"
                        )
                    )

                if not registration_role:
                    return RedirectResponse(
                        url=(
                            f"{get_frontend_url()}"
                            "/register"
                            "?google_error=role_required"
                        )
                    )

                role = validate_role(
                    registration_role
                )

                base_username = (
                    google_email
                    .split("@")[0]
                    .strip()
                )

                if len(base_username) < 3:
                    base_username = "googleuser"

                username = base_username
                counter = 1

                while (
                    db.query(User)
                    .filter(
                        User.username == username
                    )
                    .first()
                    is not None
                ):
                    username = (
                        f"{base_username}{counter}"
                    )
                    counter += 1

                new_user = User(
                    username=username,
                    email=google_email,
                    password_hash="GOOGLE_OAUTH",
                    google_id=google_id,
                    role=role,
                    is_active=True,
                )

                db.add(new_user)
                db.commit()
                db.refresh(new_user)

                user_id = new_user.id

                print(
                    "NEW GOOGLE USER CREATED:",
                    user_id,
                    username,
                    role,
                )

            else:

                if not existing_user:
                    print(
                        "GOOGLE LOGIN BLOCKED: "
                        "ACCOUNT DOES NOT EXIST"
                    )

                    return RedirectResponse(
                        url=(
                            f"{get_frontend_url()}"
                            "/login"
                            "?google_error=not_registered"
                        )
                    )

                if not existing_user.is_active:
                    raise HTTPException(
                        status_code=403,
                        detail="User account is inactive.",
                    )

                role = validate_role(
                    existing_user.role
                )

                username = existing_user.username
                user_id = existing_user.id

                if existing_user.google_id != google_id:
                    existing_user.google_id = google_id
                    db.commit()

                print(
                    "EXISTING GOOGLE USER LOGIN:",
                    user_id,
                    username,
                    role,
                )

            access_token = create_access_token(
                data={
                    "sub": google_email,
                    "role": role,
                    "user_id": user_id,
                    "username": username,
                }
            )

        finally:
            db.close()

        redirect_url = (
            f"{get_frontend_url()}/oauth/callback"
            f"?access_token={access_token}"
            f"&token_type=bearer"
            f"&username={username}"
            f"&role={role}"
            f"&email={google_email}"
        )

        print("Google authentication successful.")
        print("Action:", action)
        print("Role:", role)
        print("Username:", username)
        print("====================================\n")

        return RedirectResponse(
            url=redirect_url
        )

    except OAuthError as exc:
        print("\n========== GOOGLE OAUTH ERROR ==========")
        print("Error:", repr(exc))
        print("========================================\n")

        return RedirectResponse(
            url=(
                f"{get_frontend_url()}"
                "/login"
                "?google_error=oauth_failed"
            )
        )

    except HTTPException:
        raise

    except Exception as exc:
        print("\n========== GOOGLE CALLBACK ERROR ==========")
        print("Error:", repr(exc))
        print("Error type:", type(exc))
        print("============================================\n")

        return RedirectResponse(
            url=(
                f"{get_frontend_url()}"
                "/login"
                "?google_error=server_error"
            )
        )