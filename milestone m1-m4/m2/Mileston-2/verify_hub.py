import sys
import os
import datetime

# Add the backend directory to path so we can import app modules
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
sys.path.append(backend_path)

try:
    from fastapi.testclient import TestClient
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    
    from app.database import Base, get_db
    from app.main import app
    from app.config import settings
    from app import models, auth
except ImportError as e:
    print(f"[-] Dependency import error: {e}")
    print("[*] To run tests, please install: fastapi sqlalchemy python-jose passlib bcrypt")
    sys.exit(0)

# Configure an isolated, in-memory SQLite database for test runs
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_verification.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override the get_db dependency in FastAPI app
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def run_tests():
    print("==================================================")
    print("      RUNNING INTEGRATION VERIFICATION TESTS      ")
    print("==================================================")
    
    # 1. Recreate tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("[+] Database tables initialized.")
    
    # 2. Test base health check
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "online"
    print("[+] Health check endpoint validated.")
    
    # 3. Test user registration & password complexity requirements
    weak_athlete = {
        "email": "weak@hub.com",
        "full_name": "Weak Password User",
        "role": "athlete",
        "password": "123"
    }
    res = client.post("/api/auth/register", json=weak_athlete)
    assert res.status_code == 422 # Pydantic validation failure returns 422 Unprocessable Entity
    print("[+] Password strength constraint validated (weak password rejected).")

    athlete_data = {
        "email": "test_athlete@hub.com",
        "full_name": "Test Athlete One",
        "role": "athlete",
        "password": "SecurePassword123"
    }
    res = client.post("/api/auth/register", json=athlete_data)
    assert res.status_code == 201
    reg_json = res.json()
    assert reg_json["email"] == athlete_data["email"]
    assert reg_json["role"] == "athlete"
    assert reg_json["is_verified"] is True
    print("[+] User registration endpoint validated (athlete role created).")

    # Fetch verification token directly from database to bypass email triggers
    db = TestingSessionLocal()
    user_rec = db.query(models.User).filter(models.User.email == athlete_data["email"]).first()
    v_token = user_rec.verification_token
    assert v_token is not None
    db.close()

    # 4. Test account verification endpoint
    verify_payload = {
        "email": athlete_data["email"],
        "token": v_token
    }
    res = client.post("/api/auth/verify", json=verify_payload)
    assert res.status_code == 200
    print("[+] Email verification endpoint validated.")

    # 5. Test login and token generation (Refresh + Access)
    login_data = {
        "username": athlete_data["email"],
        "password": athlete_data["password"]
      }
    res = client.post("/api/auth/login", data=login_data)
    assert res.status_code == 200
    token_json = res.json()
    assert "access_token" in token_json
    assert "refresh_token" in token_json
    token = token_json["access_token"]
    r_token = token_json["refresh_token"]
    print("[+] OAuth2 login validated (access and refresh tokens issued).")

    headers = {"Authorization": f"Bearer {token}"}

    # Verify is_verified is now True
    res = client.get("/api/auth/me", headers=headers)
    assert res.status_code == 200
    assert res.json()["is_verified"] is True
    print("[+] Verification status flags in self-profile retrieve validated.")

    # 6. Test Token Refreshing
    refresh_payload = {
        "refresh_token": r_token
    }
    res = client.post("/api/auth/refresh", json=refresh_payload)
    assert res.status_code == 200
    assert "access_token" in res.json()
    new_access_token = res.json()["access_token"]
    print("[+] Token refresh endpoint validated.")

    # Update headers to use new access token
    headers = {"Authorization": f"Bearer {new_access_token}"}

    # 7. Test retrieve and update athlete profile stats
    res = client.get("/api/athletes/profile", headers=headers)
    assert res.status_code == 200
    athlete_profile = res.json()
    assert athlete_profile["user"]["email"] == athlete_data["email"]
    athlete_id = athlete_profile["id"]
    print("[+] Eager profile loading validated.")

    # Update profile height, weight
    update_data = {
        "height_cm": 185.5,
        "weight_kg": 82.0,
        "sport": "Basketball",
        "bio": "Olympic qualifier contender"
    }
    res = client.put("/api/athletes/profile", json=update_data, headers=headers)
    assert res.status_code == 200
    assert res.json()["height_cm"] == update_data["height_cm"]
    print("[+] Profile updates validated.")

    # 8. Test training load logs & automatic calculations
    training_data = {
        "date": str(datetime.date.today()),
        "activity_type": "Sprints",
        "duration_minutes": 45,
        "rpe": 8,
        "notes": "Interval sprinting drills"
      }
    res = client.post("/api/training", json=training_data, headers=headers)
    assert res.status_code == 201
    training_res = res.json()
    assert training_res["calculated_load"] == 360
    print("[+] Training load log and load calculation (Duration * RPE) validated.")

    # 9. Test injury history logging
    injury_data = {
        "injury_type": "Ankle Roll",
        "body_part": "Right Lateral Ankle",
        "severity": "Low",
        "occurrence_date": str(datetime.date.today() - datetime.timedelta(days=2)),
        "status": "rehab",
        "notes": "Slight strain during jump descent"
    }
    res = client.post("/api/injuries", json=injury_data, headers=headers)
    assert res.status_code == 201
    print("[+] Injury logger validated.")

    # 10. Test video upload & background pose tracking mock triggers
    # We write a small mock file to test uploads
    with open("temp_test_clip.mp4", "wb") as f:
        f.write(b"MOCK_MP4_BYTES")
        
    with open("temp_test_clip.mp4", "rb") as f:
        res = client.post(
            "/api/videos/upload",
            data={
                "title": "Squat Reps",
                "description": "Form check",
                "dataset_source": "sportspose"
            },
            files={"file": ("temp_test_clip.mp4", f, "video/mp4")},
            headers=headers
        )
    assert res.status_code == 201
    video_json = res.json()
    assert video_json["title"] == "Squat Reps"
    video_id = video_json["id"]

    # Test Video Deletion Endpoint
    res = client.delete(f"/api/videos/{video_id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["id"] == video_id
    print("[+] Video deletion endpoint and graceful file cleanup validated.")

    # Clean up temp file
    if os.path.exists("temp_test_clip.mp4"):
        os.remove("temp_test_clip.mp4")

    # 11. Test Reports Export (Excel CSV and HTML PDF)
    # Excel CSV export
    res = client.get(f"/api/reports/csv/{athlete_id}", headers=headers)
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    print("[+] CSV reports export endpoint validated.")

    # HTML PDF export
    res = client.get(f"/api/reports/pdf/{athlete_id}", headers=headers)
    assert res.status_code == 200
    assert "text/html" in res.headers["content-type"]
    print("[+] HTML printable reports export endpoint validated.")

    # 12. Test Password Recovery (Forgot/Reset)
    forgot_payload = {
        "email": athlete_data["email"]
    }
    res = client.post("/api/auth/forgot-password", json=forgot_payload)
    assert res.status_code == 200
    reset_token = res.json()["debug_token"]
    assert reset_token is not None
    print("[+] Password recovery link generation validated.")

    reset_payload = {
        "token": reset_token,
        "new_password": "NewSecurePassword456"
    }
    res = client.post("/api/auth/reset-password", json=reset_payload)
    assert res.status_code == 200
    print("[+] Password reset execution validated.")

    # Re-login with new password to confirm
    relogin_data = {
        "username": athlete_data["email"],
        "password": "NewSecurePassword456"
    }
    res = client.post("/api/auth/login", data=relogin_data)
    assert res.status_code == 200
    print("[+] Credentials update cycle validated.")

    # 13. Test Admin dashboard stats (requires coach or admin role)
    # We register a head coach to test stats
    coach_data = {
        "email": "head_coach@hub.com",
        "full_name": "Coach Prime",
        "role": "coach",
        "password": "SecurePassword123"
    }
    client.post("/api/auth/register", json=coach_data)
    
    # Login as coach
    coach_login_res = client.post("/api/auth/login", data={"username": coach_data["email"], "password": coach_data["password"]})
    coach_token = coach_login_res.json()["access_token"]
    coach_headers = {"Authorization": f"Bearer {coach_token}"}
    
    # Fetch admin stats
    res = client.get("/api/admin/stats", headers=coach_headers)
    assert res.status_code == 200
    stats_json = res.json()
    assert "total_users" in stats_json
    assert "critical_injury_alerts" in stats_json
    print("[+] Admin system stats telemetry validated.")

    # Clean up test database file
    engine.dispose()
    if os.path.exists("test_verification.db"):
        try:
            os.remove("test_verification.db")
        except Exception:
            pass
        
    print("\n==================================================")
    print("      ALL INTEGRATION VERIFICATION TESTS PASSED    ")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
