from fastapi import APIRouter

router = APIRouter()


@router.post("/register")
def register():
    return {
        "message": "User registration endpoint created successfully",
        "status": "Registration API ready"
    }


@router.post("/login")
def login():
    return {
        "message": "User login endpoint created successfully",
        "status": "Login API ready"
    }