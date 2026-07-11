from fastapi import FastAPI

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

@app.get("/athlete")
def athlete():
    return {
        "name": "Sejal Chintala",
        "age": 20,
        "sport": "Cricket",
        "experience": "Beginner",
        "status": "Profile Created"
    }

