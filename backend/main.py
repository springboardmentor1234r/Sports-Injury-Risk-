from fastapi import FastAPI
from models.athlete import Athlete

app = FastAPI(
    title="Sports Injury Risk Detection API",
    description="Backend API for the Infosys Springboard Virtual Internship project.",
    version="1.0.0"
)


@app.get("/")
def home():
    return {
        "message": "Welcome to the Sports Injury Risk Detection API",
        "status": "Backend is running successfully"
    }


@app.get("/about")
def about():
    return {
        "project": "Sports Injury Risk Detection from Video",
        "intern": "Sejal Chintala",
        "milestone": "Milestone 1",
        "backend": "FastAPI"
    }

@app.get("/health")
def health():
    return {
        "status": "Healthy",
        "server": "Running",
        "backend": "FastAPI"
    }

@app.get("/athlete", response_model=Athlete)
def athlete():
    return Athlete(
        name="Sejal Chintala",
        age=20,
        sport="Cricket",
        experience="Beginner"
    )

@app.post("/register")
def register():
    return {
        "message": "User registration endpoint created successfully",
        "status": "Registration API ready"
    }


@app.post("/login")
def login():
    return {
        "message": "User login endpoint created successfully",
        "status": "Login API ready"
    }

