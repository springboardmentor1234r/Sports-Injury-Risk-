from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.mongo_utils import get_db_connection
from database.sql_utils import get_connection, USE_LOCAL_DB

# Import routers
from api.routers.auth_router import router as auth_router, google_auth_router
from api.routers.profile_router import router as profile_router
from api.routers.sessions_router import router as sessions_router
from api.routers.recommendations_router import router as recommendations_router
from api.routers.coach_router import router as coach_router
from api.routers.cloudinary_router import router as cloudinary_router
from api.routers.ops_router import router as ops_router
from api.routers.ws_router import router as ws_router
from api.routers.notifications_router import router as notifications_router
from api.routers.webhook_router import router as webhook_router
from api.routers.chat_router import router as chat_router

app = FastAPI(
    title="Sports Injury Risk Detection API",
    description="Backend API for managing athletes, processing video analysis, and generating AI rehab recommendations.",
    version="1.0.0"
)

from api.utils.rate_limiter import setup_rate_limiting
setup_rate_limiting(app)

@app.on_event("startup")
async def startup_event():
    from database.mongo_utils import initialize_mongodb_indexes
    initialize_mongodb_indexes()

# Configure CORS (Permissive for local development)
from fastapi.middleware.cors import CORSMiddleware

# Enable CORS for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://move-iq-theta.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(sessions_router)
app.include_router(recommendations_router)
app.include_router(coach_router)
app.include_router(cloudinary_router)
app.include_router(ops_router, include_in_schema=False)
app.include_router(google_auth_router)
app.include_router(ws_router)
app.include_router(notifications_router)
app.include_router(webhook_router)
app.include_router(chat_router)

from fastapi.responses import RedirectResponse

@app.get("/", include_in_schema=False)
def root():
    """Redirects the root URL to the Swagger documentation."""
    return RedirectResponse(url="/docs")

@app.api_route("/api/health", methods=["GET", "HEAD"], tags=["health"])
def health_check():
    """
    Health check endpoint.
    Verifies that both MySQL and MongoDB connections are alive.
    """
    status = {"status": "ok", "sql": "disconnected", "mongodb": "disconnected"}
    status["sql_type"] = "MySQL (Local)" if USE_LOCAL_DB else "PostgreSQL (Supabase)"
    
    # Check SQL
    try:
        from database.sql_utils import get_connection, release_connection
        conn = get_connection()
        if conn:
            status["sql"] = "connected"
            release_connection(conn)
    except Exception as e:
        status["sql_error"] = str(e)
        
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
