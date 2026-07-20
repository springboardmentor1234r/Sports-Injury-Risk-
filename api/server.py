from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.mongo_utils import get_db_connection
from api.auth.mysql_auth import get_connection

# Import routers
from api.routers.auth_router import router as auth_router
from api.routers.profile_router import router as profile_router
from api.routers.sessions_router import router as sessions_router
from api.routers.recommendations_router import router as recommendations_router

app = FastAPI(
    title="Sports Injury Risk Detection API",
    description="Backend API for managing athletes, processing video analysis, and generating AI rehab recommendations.",
    version="1.0.0"
)

# Configure CORS (Permissive for local development)
from fastapi.middleware.cors import CORSMiddleware

# Enable CORS for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(sessions_router)
app.include_router(recommendations_router)

from fastapi.responses import RedirectResponse

@app.get("/", include_in_schema=False)
def root():
    """Redirects the root URL to the Swagger documentation."""
    return RedirectResponse(url="/docs")

@app.get("/api/health", tags=["health"])
def health_check():
    """
    Health check endpoint.
    Verifies that both MySQL and MongoDB connections are alive.
    """
    status = {"status": "ok", "mysql": "disconnected", "mongodb": "disconnected"}
    
    # Check MySQL
    try:
        conn = get_connection()
        if conn:
            status["mysql"] = "connected"
            conn.close()
    except Exception as e:
        status["mysql_error"] = str(e)
        
    # Check MongoDB
    try:
        db = get_db_connection()
        # Ping already happens in get_db_connection
        status["mongodb"] = "connected"
    except Exception as e:
        status["mongodb_error"] = str(e)
        
    # If either is disconnected, return a 500 or just report the status
    return status

# Run instructions for the user:
# uvicorn api.server:app --reload --port 8000
